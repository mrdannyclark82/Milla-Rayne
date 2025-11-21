import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateZKProof,
  verifyZKProof,
  storeInVault,
  retrieveFromVault,
  issueVerifiableCredential,
  verifyCredential,
  createSSIProfile,
  getUserVaultEntries,
  getProofsByClaim,
  getUserCredentials,
  getSSIStats,
} from '../decentralizationService';

describe('Decentralization Service - SSI Pilot', () => {
  describe('Zero-Knowledge Proofs', () => {
    it('should generate a ZK proof for a claim', () => {
      const userId = 'user123';
      const claim = 'age_over_18';
      const secretData = '25';

      const proof = generateZKProof(userId, claim, secretData, 'true');

      expect(proof).toBeDefined();
      expect(proof.id).toMatch(/^zkp_/);
      expect(proof.claim).toBe(claim);
      expect(proof.proof).toBeDefined();
      expect(proof.publicInput).toBe('true');
      expect(proof.timestamp).toBeLessThanOrEqual(Date.now());
      expect(proof.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should verify a valid ZK proof', () => {
      const userId = 'user456';
      const claim = 'verified_email';
      const secretData = 'user@example.com';

      const proof = generateZKProof(userId, claim, secretData);
      const isValid = verifyZKProof(proof.id);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid proof ID', () => {
      const isValid = verifyZKProof('invalid_proof_id');

      expect(isValid).toBe(false);
    });

    it('should generate different proofs for the same claim', () => {
      const userId = 'user789';
      const claim = 'age_over_18';
      const secretData = '30';

      const proof1 = generateZKProof(userId, claim, secretData);
      const proof2 = generateZKProof(userId, claim, secretData);

      expect(proof1.id).not.toBe(proof2.id);
      expect(proof1.proof).not.toBe(proof2.proof);
    });
  });

  describe('Decentralized Vault', () => {
    it('should store data in the vault with encryption', () => {
      const userId = 'user123';
      const dataType = 'identity';
      const data = JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const vaultEntry = storeInVault(userId, dataType, data);

      expect(vaultEntry).toBeDefined();
      expect(vaultEntry.id).toMatch(/^vault_/);
      expect(vaultEntry.userId).toBe(userId);
      expect(vaultEntry.dataType).toBe(dataType);
      expect(vaultEntry.encryptedData).toBeDefined();
      expect(vaultEntry.encryptedData).toContain('HE_v1:'); // Homomorphic encryption marker
      expect(vaultEntry.decentralizedLocation).toMatch(/^Qm/); // Mock IPFS hash
      expect(vaultEntry.metadata.created).toBeLessThanOrEqual(Date.now());
      expect(vaultEntry.metadata.accessCount).toBe(0);
    });

    it('should retrieve data from the vault', () => {
      const userId = 'user456';
      const dataType = 'credential';
      const originalData = 'sensitive credential data';

      const vaultEntry = storeInVault(userId, dataType, originalData);
      const retrievedData = retrieveFromVault(vaultEntry.id, userId);

      expect(retrievedData).toBe(originalData);
    });

    it('should prevent unauthorized access to vault data', () => {
      const userId = 'user789';
      const unauthorizedUserId = 'user999';
      const data = 'private data';

      const vaultEntry = storeInVault(userId, 'identity', data);
      const retrievedData = retrieveFromVault(
        vaultEntry.id,
        unauthorizedUserId
      );

      expect(retrievedData).toBeNull();
    });

    it('should return null for non-existent vault entry', () => {
      const retrievedData = retrieveFromVault('invalid_entry_id', 'user123');

      expect(retrievedData).toBeNull();
    });

    it('should track access metadata', () => {
      const userId = 'user123';
      const data = 'test data';

      const vaultEntry = storeInVault(userId, 'test', data);

      // Access the data multiple times
      retrieveFromVault(vaultEntry.id, userId);
      retrieveFromVault(vaultEntry.id, userId);
      retrieveFromVault(vaultEntry.id, userId);

      const entries = getUserVaultEntries(userId);
      const updatedEntry = entries.find((e) => e.id === vaultEntry.id);

      expect(updatedEntry?.metadata.accessCount).toBe(3);
      expect(updatedEntry?.metadata.lastAccessed).toBeDefined();
    });
  });

  describe('Verifiable Credentials', () => {
    it('should issue a verifiable credential', () => {
      const subject = 'user123';
      const type = 'EmailVerification';
      const claims = { verified: true, email: 'user@example.com' };

      const credential = issueVerifiableCredential(subject, type, claims);

      expect(credential).toBeDefined();
      expect(credential.id).toMatch(/^vc_/);
      expect(credential.type).toBe(type);
      expect(credential.subject).toBe(subject);
      expect(credential.issuer).toBe('milla-rayne-system');
      expect(credential.claims).toEqual(claims);
      expect(credential.proof).toBeDefined();
      expect(credential.issuedAt).toBeLessThanOrEqual(Date.now());
      expect(credential.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should verify a valid credential', () => {
      const subject = 'user456';
      const type = 'AgeVerification';
      const claims = { verified: true, age_over_18: true };

      const credential = issueVerifiableCredential(subject, type, claims);
      const isValid = verifyCredential(credential.id);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid credential ID', () => {
      const isValid = verifyCredential('invalid_credential_id');

      expect(isValid).toBe(false);
    });

    it('should allow custom issuer', () => {
      const subject = 'user789';
      const type = 'CustomCredential';
      const claims = { custom: 'data' };
      const issuer = 'custom-issuer-system';

      const credential = issueVerifiableCredential(
        subject,
        type,
        claims,
        issuer
      );

      expect(credential.issuer).toBe(issuer);
    });
  });

  describe('SSI Profile Creation', () => {
    it('should create a complete SSI profile with age verification', () => {
      const userId = 'user123';
      const identityData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const profile = createSSIProfile(userId, identityData);

      expect(profile).toBeDefined();
      expect(profile.vaultEntry).toBeDefined();
      expect(profile.vaultEntry.userId).toBe(userId);
      expect(profile.zkProofs.length).toBeGreaterThan(0);
      expect(profile.credentials.length).toBeGreaterThan(0);

      // Check for age proof
      const ageProof = profile.zkProofs.find((p) => p.claim === 'age_over_18');
      expect(ageProof).toBeDefined();

      // Check for age credential
      const ageCredential = profile.credentials.find(
        (c) => c.type === 'AgeVerification'
      );
      expect(ageCredential).toBeDefined();
      expect(ageCredential?.claims.verified).toBe(true);
    });

    it('should create a complete SSI profile with email verification', () => {
      const userId = 'user456';
      const identityData = {
        email: 'test@example.com',
      };

      const profile = createSSIProfile(userId, identityData);

      // Check for email proof
      const emailProof = profile.zkProofs.find(
        (p) => p.claim === 'verified_email'
      );
      expect(emailProof).toBeDefined();

      // Check for email credential
      const emailCredential = profile.credentials.find(
        (c) => c.type === 'EmailVerification'
      );
      expect(emailCredential).toBeDefined();
      expect(emailCredential?.claims.verified).toBe(true);
      expect(emailCredential?.claims.domain).toBe('example.com');
    });

    it('should retrieve user vault entries', () => {
      const userId = 'user789';
      const identityData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 30,
      };

      createSSIProfile(userId, identityData);
      const entries = getUserVaultEntries(userId);

      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.userId === userId)).toBe(true);
    });

    it('should retrieve proofs by claim type', () => {
      const userId = 'user999';
      const identityData = {
        age: 28,
      };

      createSSIProfile(userId, identityData);
      const ageProofs = getProofsByClaim('age_over_18');

      expect(ageProofs.length).toBeGreaterThan(0);
      expect(ageProofs.every((p) => p.claim === 'age_over_18')).toBe(true);
    });

    it('should retrieve user credentials', () => {
      const userId = 'user888';
      const identityData = {
        email: 'user@example.com',
        age: 22,
      };

      createSSIProfile(userId, identityData);
      const credentials = getUserCredentials(userId);

      expect(credentials.length).toBeGreaterThan(0);
      expect(credentials.every((c) => c.subject === userId)).toBe(true);
    });
  });

  describe('SSI Statistics', () => {
    it('should provide system statistics', () => {
      // Create some test data
      createSSIProfile('user1', { email: 'user1@example.com', age: 25 });
      createSSIProfile('user2', { email: 'user2@example.com', age: 30 });

      const stats = getSSIStats();

      expect(stats).toBeDefined();
      expect(stats.totalVaultEntries).toBeGreaterThan(0);
      expect(stats.totalZKProofs).toBeGreaterThan(0);
      expect(stats.totalCredentials).toBeGreaterThan(0);
      expect(stats.activeProofs).toBeGreaterThan(0);
      expect(stats.expiredProofs).toBeGreaterThanOrEqual(0);
    });
  });
});
