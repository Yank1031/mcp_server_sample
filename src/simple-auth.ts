import express from 'express';
import crypto from 'crypto';
import { Request, Response } from 'express';

// Simplified OAuth 2.1 for MCP compatibility
export class SimpleMCPAuth {
  private accessTokens: Map<string, any> = new Map();

  constructor() {
    // Create a default access token for testing
    const defaultToken = 'mcp-test-token-' + crypto.randomBytes(16).toString('hex');
    this.accessTokens.set(defaultToken, {
      client_id: 'anthropic-api',
      scope: 'mcp:read mcp:tools',
      expires_at: Date.now() + 86400000, // 24 hours
      created_at: Date.now()
    });
    
    console.log(`Default access token created: ${defaultToken}`);
  }

  // OAuth 2.0 Authorization Server Metadata (minimal for MCP)
  getMetadata() {
    const baseUrl = process.env.BASE_URL || 'https://employee-mcp-server.onrender.com';
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      scopes_supported: ['mcp:read', 'mcp:tools'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256']
    };
  }

  // Validate access token
  validateAccessToken(token: string): any {
    const tokenData = this.accessTokens.get(token);
    if (!tokenData || tokenData.expires_at < Date.now()) {
      return null;
    }
    return tokenData;
  }

  // Create access token for testing
  createTestToken(): string {
    const token = 'mcp-token-' + crypto.randomBytes(16).toString('hex');
    this.accessTokens.set(token, {
      client_id: 'test-client',
      scope: 'mcp:read mcp:tools',
      expires_at: Date.now() + 86400000, // 24 hours
      created_at: Date.now()
    });
    return token;
  }

  // Setup minimal OAuth routes for MCP
  setupRoutes(app: express.Application) {
    // OAuth 2.0 Authorization Server Metadata
    app.get('/.well-known/oauth-authorization-server', (req, res) => {
      res.json(this.getMetadata());
    });

    // Simplified token endpoint for testing
    app.post('/token', (req, res) => {
      // For testing, always return a valid token
      const token = this.createTestToken();
      res.json({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'mcp:read mcp:tools'
      });
    });

    // Test token creation endpoint
    app.post('/create-test-token', (req, res) => {
      const token = this.createTestToken();
      res.json({ access_token: token });
    });
  }
}
