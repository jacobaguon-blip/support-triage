/**
 * Agent Findings Aggregator
 * Combines agent findings into summary and customer response
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

class FindingsAggregator {
  constructor() {
    this.investigationsRoot = path.join(os.homedir(), 'support-triage', 'investigations');
  }

  /**
   * Get investigation directory path
   */
  getInvestigationDir(ticketNumber, runNumber = 1) {
    return path.join(this.investigationsRoot, `${ticketNumber}`, `investigation-${runNumber}`);
  }

  /**
   * Read agent findings file
   */
  async readAgentFindings(ticketNumber, agentName, runNumber = 1) {
    const investigationDir = this.getInvestigationDir(ticketNumber, runNumber);
    const findingsFile = path.join(investigationDir, `${agentName.toLowerCase()}-findings.md`);

    try {
      const content = await fs.promises.readFile(findingsFile, 'utf8');
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist yet
      }
      throw error;
    }
  }

  /**
   * Aggregate all agent findings into a summary
   */
  async aggregateSummary(ticketNumber, agents, runNumber = 1) {
    const findings = {};

    // Read all agent findings
    for (const agent of agents) {
      const agentName = agent.name || agent;
      const content = await this.readAgentFindings(ticketNumber, agentName, runNumber);
      if (content) {
        findings[agentName] = content;
      }
    }

    // Build summary document
    const summary = this.buildSummary(ticketNumber, findings);

    // Save summary to file
    await this.saveSummary(ticketNumber, summary, runNumber);

    return summary;
  }

  /**
   * Build summary document from agent findings
   */
  buildSummary(ticketNumber, findings) {
    const lines = [
      `# Investigation Summary for Ticket ${ticketNumber}`,
      '',
      `**Generated:** ${new Date().toLocaleString()}`,
      '',
      '---',
      ''
    ];

    // Add findings from each agent
    const agentOrder = ['Slack', 'Linear', 'Pylon', 'Codebase'];

    for (const agentName of agentOrder) {
      if (findings[agentName]) {
        lines.push(`## ${agentName} Agent Findings`);
        lines.push('');
        lines.push(findings[agentName]);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    // Add any agents not in the standard order
    for (const agentName in findings) {
      if (!agentOrder.includes(agentName)) {
        lines.push(`## ${agentName} Agent Findings`);
        lines.push('');
        lines.push(findings[agentName]);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    // If no findings yet
    if (Object.keys(findings).length === 0) {
      lines.push('## Status');
      lines.push('');
      lines.push('_No agent findings available yet. Agents are still working..._');
      lines.push('');
    } else {
      lines.push('## Next Steps');
      lines.push('');
      lines.push('1. Review findings above');
      lines.push('2. Switch to Response tab to view customer response draft');
      lines.push('3. Edit response as needed');
      lines.push('4. Copy response and send to customer via Pylon');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Save summary to file
   */
  async saveSummary(ticketNumber, summary, runNumber = 1) {
    const investigationDir = this.getInvestigationDir(ticketNumber, runNumber);
    const summaryFile = path.join(investigationDir, 'summary.md');

    await fs.promises.mkdir(investigationDir, { recursive: true });
    await fs.promises.writeFile(summaryFile, summary, 'utf8');
  }

  /**
   * Generate customer response from findings
   */
  async generateCustomerResponse(ticketNumber, agents, runNumber = 1) {
    const findings = {};

    // Read all agent findings
    for (const agent of agents) {
      const agentName = agent.name || agent;
      const content = await this.readAgentFindings(ticketNumber, agentName, runNumber);
      if (content) {
        findings[agentName] = content;
      }
    }

    // Build customer response
    const response = this.buildCustomerResponse(ticketNumber, findings);

    // Save response to file
    await this.saveCustomerResponse(ticketNumber, response, runNumber);

    return response;
  }

  /**
   * Build customer-facing response from findings
   */
  buildCustomerResponse(ticketNumber, findings) {
    // If no findings yet, return placeholder
    if (Object.keys(findings).length === 0) {
      return `[Customer response will be generated once agents complete their investigation]

Status: Investigation in progress...

We'll notify you as soon as we have findings to share.`;
    }

    // Extract key information from findings
    const hasSlackFindings = !!findings['Slack'];
    const hasLinearFindings = !!findings['Linear'];
    const hasPylonFindings = !!findings['Pylon'];
    const hasCodebaseFindings = !!findings['Codebase'];

    // Build friendly customer response
    const lines = [
      `Hi there,`,
      '',
      `Thank you for reaching out. We've investigated your issue and here's what we found:`,
      ''
    ];

    // Add findings summary (simplified for customer)
    if (hasCodebaseFindings) {
      lines.push(`**What we discovered:**`);
      lines.push(`We reviewed the relevant code and identified the areas related to your issue.`);
      lines.push('');
    }

    if (hasLinearFindings) {
      lines.push(`**Related work:**`);
      lines.push(`We checked our issue tracker and found related engineering work that may address this.`);
      lines.push('');
    }

    if (hasSlackFindings) {
      lines.push(`**Internal discussions:**`);
      lines.push(`Our team has discussed similar issues and we have additional context that may help.`);
      lines.push('');
    }

    // Next steps
    lines.push(`**Next steps:**`);
    lines.push(`- [ ] Review detailed findings in the investigation summary`);
    lines.push(`- [ ] Determine if this is a bug, feature request, or expected behavior`);
    lines.push(`- [ ] Create Linear issue if needed`);
    lines.push(`- [ ] Provide updated timeline to customer`);
    lines.push('');

    lines.push(`Please let us know if you have any questions!`);
    lines.push('');
    lines.push(`Best regards,`);
    lines.push(`Technical Support Team`);

    return lines.join('\n');
  }

  /**
   * Save customer response to file
   */
  async saveCustomerResponse(ticketNumber, response, runNumber = 1) {
    const investigationDir = this.getInvestigationDir(ticketNumber, runNumber);
    const responseFile = path.join(investigationDir, 'customer-response.md');

    await fs.promises.mkdir(investigationDir, { recursive: true });
    await fs.promises.writeFile(responseFile, response, 'utf8');
  }

  /**
   * Load summary from file
   */
  async loadSummary(ticketNumber, runNumber = 1) {
    const investigationDir = this.getInvestigationDir(ticketNumber, runNumber);
    const summaryFile = path.join(investigationDir, 'summary.md');

    try {
      const content = await fs.promises.readFile(summaryFile, 'utf8');
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, generate it
        return await this.aggregateSummary(ticketNumber, [], runNumber);
      }
      throw error;
    }
  }

  /**
   * Load customer response from file
   */
  async loadCustomerResponse(ticketNumber, runNumber = 1) {
    const investigationDir = this.getInvestigationDir(ticketNumber, runNumber);
    const responseFile = path.join(investigationDir, 'customer-response.md');

    try {
      const content = await fs.promises.readFile(responseFile, 'utf8');
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, generate it
        return await this.generateCustomerResponse(ticketNumber, [], runNumber);
      }
      throw error;
    }
  }

  /**
   * Update customer response (after manual editing)
   */
  async updateCustomerResponse(ticketNumber, newResponse, runNumber = 1) {
    await this.saveCustomerResponse(ticketNumber, newResponse, runNumber);
  }
}

export default FindingsAggregator;
