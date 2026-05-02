/**
 * Database Adapter
 * Queries SQLite database for investigations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseAdapter {
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(__dirname, '../../triage.db');
  }

  /**
   * Get all investigations from database
   * Note: In browser, the Express server handles SQLite queries
   * In TUI, we need a different approach - either:
   * 1. Use better-sqlite3 (Node.js SQLite)
   * 2. Make HTTP calls to the Express API
   *
   * For now, we'll use the Express API approach
   */
  async getAllInvestigations() {
    try {
      const response = await fetch('http://localhost:3001/api/investigations');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching investigations:', error);
      return [];
    }
  }

  async getInvestigation(id) {
    try {
      const response = await fetch(`http://localhost:3001/api/investigations/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching investigation:', error);
      return null;
    }
  }

  async createInvestigation(data) {
    try {
      const response = await fetch('http://localhost:3001/api/investigations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating investigation:', error);
      console.error('Data sent:', JSON.stringify(data, null, 2));
      return null;
    }
  }

  async updateInvestigation(id, data) {
    try {
      const response = await fetch(`http://localhost:3001/api/investigations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating investigation:', error);
      return null;
    }
  }

  async searchInvestigations(query) {
    try {
      const allInvestigations = await this.getAllInvestigations();

      // Simple search - filter by ticket number or customer name
      const searchLower = query.toLowerCase();
      return allInvestigations.filter(inv => {
        return (
          (inv.id && inv.id.toString().includes(searchLower)) ||
          (inv.customer_name && inv.customer_name.toLowerCase().includes(searchLower)) ||
          (inv.classification && inv.classification.toLowerCase().includes(searchLower))
        );
      });
    } catch (error) {
      console.error('Error searching investigations:', error);
      return [];
    }
  }
}

export default DatabaseAdapter;
