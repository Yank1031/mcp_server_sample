import express from 'express';
import crypto from 'crypto';
import { Request, Response } from 'express';

// OAuth 2.1 Implementation for MCP Server
export class OAuth2Server {
  private clients: Map<string, any> = new Map();
  private authCodes: Map<string, any> = new Map();
  private accessTokens: Map<string, any> = new Map();
  private refreshTokens: Map<string, any> = new Map();

  constructor() {
    // デフォルトクライアントを登録（テスト用）
    this.clients.set('default-client', {
      client_id: 'default-client',
      client_secret: null, // Public client
      redirect_uris: ['http://localhost:3000/callback', 'https://api.anthropic.com/v1/mcp/callback'],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_name: 'Default MCP Client'
    });
  }

  // OAuth 2.0 Authorization Server Metadata (RFC 8414)
  getMetadata() {
    const baseUrl = process.env.BASE_URL || 'https://employee-mcp-server.onrender.com';
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      registration_endpoint: `${baseUrl}/register`,
      scopes_supported: ['mcp:read', 'mcp:tools'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
      pkce_required: true
    };
  }

  // Dynamic Client Registration (RFC 7591)
  registerClient(registrationData: any) {
    const clientId = crypto.randomBytes(16).toString('hex');
    const client = {
      client_id: clientId,
      client_secret: null, // Public client for MCP
      ...registrationData,
      client_id_issued_at: Math.floor(Date.now() / 1000)
    };

    this.clients.set(clientId, client);
    return client;
  }

  // Authorization Endpoint
  authorize(req: Request, res: Response) {
    const {
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      response_type,
      scope,
      state
    } = req.query;

    // Validate client
    const client = this.clients.get(client_id as string);
    if (!client) {
      return res.status(400).json({ error: 'invalid_client' });
    }

    // Validate redirect URI
    if (!client.redirect_uris.includes(redirect_uri)) {
      return res.status(400).json({ error: 'invalid_redirect_uri' });
    }

    // Validate PKCE (required)
    if (!code_challenge || code_challenge_method !== 'S256') {
      return res.status(400).json({ error: 'invalid_request', error_description: 'PKCE required' });
    }

    // Generate authorization code
    const authCode = crypto.randomBytes(32).toString('hex');
    this.authCodes.set(authCode, {
      client_id,
      redirect_uri,
      code_challenge,
      scope: scope || 'mcp:read mcp:tools',
      expires_at: Date.now() + 600000, // 10 minutes
      used: false
    });

    // For simplicity, auto-approve (in real implementation, show consent screen)
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.set('code', authCode);
    if (state) redirectUrl.searchParams.set('state', state as string);

    res.redirect(redirectUrl.toString());
  }

  // Token Endpoint
  token(req: Request, res: Response) {
    const { grant_type, code, client_id, code_verifier, refresh_token } = req.body;

    if (grant_type === 'authorization_code') {
      return this.handleAuthorizationCode(req, res);
    } else if (grant_type === 'refresh_token') {
      return this.handleRefreshToken(req, res);
    } else {
      return res.status(400).json({ error: 'unsupported_grant_type' });
    }
  }

  private handleAuthorizationCode(req: Request, res: Response) {
    const { code, client_id, code_verifier } = req.body;

    // Validate authorization code
    const authData = this.authCodes.get(code);
    if (!authData || authData.used || authData.expires_at < Date.now()) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    // Validate client
    if (authData.client_id !== client_id) {
      return res.status(400).json({ error: 'invalid_client' });
    }

    // Validate PKCE
    const expectedChallenge = crypto
      .createHash('sha256')
      .update(code_verifier)
      .digest('base64url');

    if (expectedChallenge !== authData.code_challenge) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE validation failed' });
    }

    // Mark code as used
    authData.used = true;

    // Generate tokens
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');

    const tokenData = {
      client_id,
      scope: authData.scope,
      expires_at: Date.now() + 3600000, // 1 hour
      created_at: Date.now()
    };

    this.accessTokens.set(accessToken, tokenData);
    this.refreshTokens.set(refreshTokenValue, { ...tokenData, access_token: accessToken });

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshTokenValue,
      scope: authData.scope
    });
  }

  private handleRefreshToken(req: Request, res: Response) {
    const { refresh_token } = req.body;

    const tokenData = this.refreshTokens.get(refresh_token);
    if (!tokenData) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    // Generate new access token
    const newAccessToken = crypto.randomBytes(32).toString('hex');
    const newTokenData = {
      ...tokenData,
      expires_at: Date.now() + 3600000,
      created_at: Date.now()
    };

    // Remove old access token
    this.accessTokens.delete(tokenData.access_token);

    // Store new access token
    this.accessTokens.set(newAccessToken, newTokenData);
    tokenData.access_token = newAccessToken;

    res.json({
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: tokenData.scope
    });
  }

  // Validate access token
  validateAccessToken(token: string): any {
    const tokenData = this.accessTokens.get(token);
    if (!tokenData || tokenData.expires_at < Date.now()) {
      return null;
    }
    return tokenData;
  }

  // Setup OAuth routes
  setupRoutes(app: express.Application) {
    // OAuth 2.0 Authorization Server Metadata
    app.get('/.well-known/oauth-authorization-server', (req, res) => {
      res.json(this.getMetadata());
    });

    // Dynamic Client Registration
    app.post('/register', (req, res) => {
      try {
        const client = this.registerClient(req.body);
        res.status(201).json(client);
      } catch (error) {
        res.status(400).json({ error: 'invalid_client_metadata' });
      }
    });

    // Authorization Endpoint
    app.get('/authorize', (req, res) => {
      this.authorize(req, res);
    });

    // Token Endpoint
    app.post('/token', (req, res) => {
      this.token(req, res);
    });
  }
}
