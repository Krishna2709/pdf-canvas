# CLAUDE.md - AI Assistant Guide for pdf-canvas

This document provides guidance for AI assistants working on the pdf-canvas project.

## Project Overview

**pdf-canvas** is a project for PDF rendering and manipulation using canvas-based technologies. The repository is currently in its initial setup phase.

## Repository Structure

```
pdf-canvas/
├── CLAUDE.md          # This file - AI assistant guidance
├── .git/              # Git version control
└── [future structure will be documented as code is added]
```

## Development Guidelines

### Getting Started

When this project is set up, typical commands will likely include:

```bash
# Install dependencies (when package.json exists)
npm install
# or
yarn install
# or
pnpm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Code Style Conventions

1. **TypeScript Preferred**: Use TypeScript for type safety when working with PDF structures and canvas operations
2. **Modular Design**: Keep PDF parsing, rendering, and UI logic separated
3. **Error Handling**: PDF operations can fail - always handle errors gracefully
4. **Memory Management**: PDF rendering can be memory-intensive; clean up resources properly

### Commit Message Format

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add PDF page rotation support`

### Branch Naming

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Claude-specific branches: `claude/claude-md-*`

## Key Technical Considerations

### PDF Processing

- PDFs can be complex with embedded fonts, images, annotations
- Consider using established libraries like `pdf.js` or `pdfkit`
- Handle encrypted/password-protected PDFs appropriately
- Be mindful of large file sizes and pagination

### Canvas Operations

- Use requestAnimationFrame for smooth rendering
- Implement proper scaling for high-DPI displays
- Handle canvas context state (save/restore)
- Consider WebGL for performance-critical operations

### Common Patterns to Follow

1. **Lazy Loading**: Load PDF pages on demand
2. **Caching**: Cache rendered pages when appropriate
3. **Worker Threads**: Use Web Workers for heavy PDF operations
4. **Responsive Design**: Handle different viewport sizes

## Testing Guidelines

When tests are implemented:

1. Unit tests for PDF parsing logic
2. Integration tests for rendering pipeline
3. Visual regression tests for canvas output
4. Performance benchmarks for large documents

## Security Considerations

- Validate PDF input to prevent malicious files
- Sanitize any text extracted from PDFs before display
- Be cautious with external URL references in PDFs
- Handle cross-origin restrictions properly

## AI Assistant Instructions

### When Working on This Codebase

1. **Explore First**: Always understand existing code before making changes
2. **Keep Changes Focused**: Make minimal, targeted modifications
3. **Test Thoroughly**: Verify changes don't break existing functionality
4. **Document Changes**: Update this file when project structure changes significantly

### Code Quality Checklist

Before committing:
- [ ] Code compiles without errors
- [ ] No new linting warnings
- [ ] Tests pass (when available)
- [ ] Changes are focused and minimal
- [ ] No hardcoded secrets or credentials

### Common Tasks

| Task | Approach |
|------|----------|
| Add new PDF feature | Check existing utilities first, extend if possible |
| Fix rendering bug | Reproduce issue, check canvas state, verify fix |
| Improve performance | Profile first, optimize bottlenecks, benchmark |
| Update dependencies | Test thoroughly after updates |

## Resources

Useful references for PDF/Canvas development:
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [PDF Specification](https://www.adobe.com/devnet/pdf/pdf_reference.html)

---

*This document will be updated as the project evolves. Last updated: 2026-01-21*
