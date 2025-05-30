
// Document generation utilities
export class DocumentGenerator {
  /**
   * Process template content with variable substitution
   */
  static processTemplate(
    content: string, 
    variables: Record<string, string | number | boolean>
  ): string {
    let processedContent = content;

    // Replace all variables in the format {{variable_name}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, String(value || ''));
    });

    // Clean up any remaining unprocessed variables
    processedContent = processedContent.replace(/{{[^}]*}}/g, '[MISSING_VALUE]');

    return processedContent;
  }

  /**
   * Generate a unique filename for document exports
   */
  static generateFilename(documentName: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedName = documentName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    return `${sanitizedName}-${timestamp}.${extension}`;
  }

  /**
   * Convert HTML content to styled document for export
   */
  static formatForExport(content: string, documentName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${documentName}</title>
    <style>
        @page {
            margin: 1in;
            size: letter;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: #000;
            margin: 20px 0 10px 0;
            font-weight: bold;
        }
        
        h1 { font-size: 18pt; }
        h2 { font-size: 16pt; }
        h3 { font-size: 14pt; }
        h4 { font-size: 12pt; }
        
        p {
            margin: 10px 0;
            text-align: justify;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        .signature-section {
            margin-top: 50px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            height: 40px;
            margin: 20px 0 5px 0;
        }
        
        .date-line {
            border-bottom: 1px solid #000;
            width: 150px;
            height: 20px;
            margin: 10px 0 5px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 9pt;
            color: #666;
        }
        
        @media print {
            body { print-color-adjust: exact; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${documentName}</h1>
    </div>
    
    <div class="content">
        ${this.convertMarkdownToHtml(content)}
    </div>
    
    <div class="footer">
        Generated on ${new Date().toLocaleDateString()}
    </div>
</body>
</html>`;
  }

  /**
   * Basic markdown to HTML conversion for document export
   */
  private static convertMarkdownToHtml(content: string): string {
    return content
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Line breaks
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>')
      // Wrap in paragraphs
      .replace(/^(?!<[h1-6]|<table|<div)(.+)/gm, '<p>$1</p>')
      // Lists - handle multiple list items
      .replace(/^\- (.+)/gm, '<li>$1</li>')
      .replace(/<li>.*<\/li>/g, (match) => `<ul>${match}</ul>`);
  }

  /**
   * Calculate document metrics
   */
  static calculateMetrics(content: string): {
    wordCount: number;
    characterCount: number;
    estimatedReadTime: number;
    pageCount: number;
  } {
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const words = text.split(' ').filter(word => word.length > 0);
    
    return {
      wordCount: words.length,
      characterCount: text.length,
      estimatedReadTime: Math.ceil(words.length / 200), // 200 words per minute
      pageCount: Math.ceil(words.length / 250) // ~250 words per page
    };
  }

  /**
   * Generate document preview with variable highlighting
   */
  static generatePreviewHtml(content: string, variables: Record<string, string | number | boolean>): string {
    let previewContent = content;
    
    // Replace variables with highlighted versions
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(
        regex, 
        `<span class="variable-highlight" title="Variable: ${key}">${value}</span>`
      );
    });

    // Highlight any unprocessed variables
    previewContent = previewContent.replace(
      /{{([^}]*)}}/g, 
      '<span class="variable-missing" title="Missing variable: $1">{{$1}}</span>'
    );

    return `
      <style>
        .variable-highlight {
          background-color: #e3f2fd;
          padding: 2px 4px;
          border-radius: 3px;
          border: 1px solid #2196f3;
          color: #1976d2;
          font-weight: 500;
        }
        .variable-missing {
          background-color: #ffebee;
          padding: 2px 4px;
          border-radius: 3px;
          border: 1px solid #f44336;
          color: #d32f2f;
          font-weight: 500;
        }
      </style>
      ${previewContent}
    `;
  }
}

// File storage utilities
export class DocumentStorage {
  /**
   * Generate a storage path for documents
   */
  static generateStoragePath(userId: string, documentId: string, filename: string): string {
    return `documents/${userId}/${documentId}/${filename}`;
  }

  /**
   * Create a data URL for file download
   */
  static createDownloadUrl(content: string, mimeType: string): string {
    const blob = new Blob([content], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Trigger file download in browser
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const url = this.createDownloadUrl(content, mimeType);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download document as HTML
   */
  static downloadAsHtml(content: string, documentName: string): void {
    const htmlContent = DocumentGenerator.formatForExport(content, documentName);
    const filename = DocumentGenerator.generateFilename(documentName, 'html');
    this.downloadFile(htmlContent, filename, 'text/html');
  }

  /**
   * Download document as plain text
   */
  static downloadAsText(content: string, documentName: string): void {
    // Strip HTML tags for plain text
    const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const filename = DocumentGenerator.generateFilename(documentName, 'txt');
    this.downloadFile(textContent, filename, 'text/plain');
  }

  /**
   * Download document as PDF (using browser print)
   */
  static downloadAsPdf(htmlContent: string): void {
    // Create a new window with PDF-optimized content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      // Add PDF-specific styling
      const pdfContent = htmlContent.replace(
        '<style>',
        `<style>
        @media print {
          @page {
            margin: 0.75in;
            size: letter;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
        `
      );
      
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        // Close window after print dialog
        setTimeout(() => {
          printWindow.close();
        }, 500);
      };
    }
  }

  /**
   * Copy content to clipboard
   */
  static async copyToClipboard(content: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}

// Version tracking utilities
export class DocumentVersioning {
  /**
   * Generate version identifier
   */
  static generateVersion(): string {
    return `v${Date.now()}`;
  }

  /**
   * Create version metadata
   */
  static createVersionMetadata(
    content: string,
    variables: Record<string, string | number | boolean>,
    changedBy: string
  ): DocumentVersion {
    const metrics = DocumentGenerator.calculateMetrics(content);
    
    return {
      id: this.generateVersion(),
      content,
      variables,
      metrics,
      changedBy,
      createdAt: new Date(),
      contentHash: this.generateContentHash(content)
    };
  }

  /**
   * Generate content hash for change detection
   */
  static generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Compare two versions to detect changes
   */
  static compareVersions(v1: DocumentVersion, v2: DocumentVersion): VersionComparison {
    return {
      hasContentChanges: v1.contentHash !== v2.contentHash,
      hasVariableChanges: JSON.stringify(v1.variables) !== JSON.stringify(v2.variables),
      wordCountDiff: v2.metrics.wordCount - v1.metrics.wordCount,
      characterCountDiff: v2.metrics.characterCount - v1.metrics.characterCount,
      timeDiff: v2.createdAt.getTime() - v1.createdAt.getTime()
    };
  }
}

// Type definitions
export interface DocumentVersion {
  id: string;
  content: string;
  variables: Record<string, string | number | boolean>;
  metrics: {
    wordCount: number;
    characterCount: number;
    estimatedReadTime: number;
    pageCount: number;
  };
  changedBy: string;
  createdAt: Date;
  contentHash: string;
}

export interface VersionComparison {
  hasContentChanges: boolean;
  hasVariableChanges: boolean;
  wordCountDiff: number;
  characterCountDiff: number;
  timeDiff: number;
}

export interface DocumentExportOptions {
  format: 'html' | 'txt' | 'pdf' | 'docx';
  includeMetadata: boolean;
  includeVariables: boolean;
  customStyles?: string;
} 