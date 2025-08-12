# Development Workflow Guide

## Overview
This document outlines the proper development workflow for the LOS App project to prevent accidental pushes to the main branch and ensure stable deployments.

## Branch Strategy

### Main Branch (`main`)
- **Purpose**: Production-ready code only
- **Deployment**: Automatically deployed to production via Netlify
- **Protection**: Should be protected against direct pushes
- **Updates**: Only via Pull Request merges from development branch

### Development Branch (`refactor/complete-modularization`)
- **Purpose**: Active development and testing
- **Deployment**: Automatically deployed to preview environment via Netlify
- **Updates**: Regular commits during development
- **Merging**: Merged to main only when features are stable and tested

## Development Workflow

### 1. Starting Development
```bash
# Always start from the development branch
git checkout refactor/complete-modularization

# Ensure you're up to date
git pull origin refactor/complete-modularization
```

### 2. Making Changes
```bash
# Make your changes
# Test thoroughly in the development environment

# Add and commit changes
git add .
git commit -m "Descriptive commit message"

# Push to development branch
git push origin refactor/complete-modularization
```

### 3. Testing in Development Environment
- Changes are automatically deployed to Netlify preview
- Test all functionality thoroughly
- Ensure no console errors
- Verify all features work as expected

### 4. Promoting to Production
```bash
# When ready for production, create a Pull Request
# From: refactor/complete-modularization
# To: main

# After PR approval and merge, main will be automatically deployed
```

### 5. After Production Deployment
```bash
# Switch back to development branch for next features
git checkout refactor/complete-modularization

# Pull latest changes from main
git pull origin main
```

## Important Rules

### ❌ NEVER DO:
- Push directly to main branch
- Commit to main branch locally
- Merge development branch to main without testing
- Deploy untested code to production

### ✅ ALWAYS DO:
- Work on the development branch
- Test thoroughly before creating PR
- Use descriptive commit messages
- Keep development branch up to date with main

## Current Status

### ✅ Completed:
- Development branch is set up (`refactor/complete-modularization`)
- Development branch is up to date with main
- Netlify is configured for both branches
- Modularization is complete

### 🔄 Next Steps:
1. Set up branch protection rules on GitHub
2. Configure Netlify to deploy from development branch by default
3. Use development branch for all future development work

## Branch Protection Setup

### GitHub Repository Settings:
1. Go to Settings > Branches
2. Add rule for `main` branch
3. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Include administrators
   - Restrict pushes that create files

### Netlify Configuration:
- **Production**: Deploy from `main` branch
- **Preview**: Deploy from `refactor/complete-modularization` branch

## Emergency Procedures

### If Main Branch Gets Corrupted:
1. **DO NOT PANIC**
2. Reset main to last known good commit
3. Force push main branch
4. Update development branch accordingly

### If Development Branch Gets Corrupted:
1. Reset development branch to match main
2. Re-apply any uncommitted changes
3. Continue development

## Commands Reference

### Daily Development Commands:
```bash
# Start work
git checkout refactor/complete-modularization
git pull origin refactor/complete-modularization

# Make changes and commit
git add .
git commit -m "Feature description"
git push origin refactor/complete-modularization

# End work
git status  # Ensure clean working directory
```

### Production Release Commands:
```bash
# Create PR from development to main
# After PR approval and merge:
git checkout main
git pull origin main
git checkout refactor/complete-modularization
git pull origin main
```

## Troubleshooting

### Common Issues:
1. **Merge Conflicts**: Resolve in development branch before creating PR
2. **Build Failures**: Fix in development branch, never push broken code to main
3. **Deployment Issues**: Check Netlify logs and fix in development branch

### Getting Help:
- Check this document first
- Review recent commits and changes
- Check Netlify deployment logs
- Ask for assistance if needed

---

**Remember**: The development branch is your friend. Use it for all development work, and only promote stable, tested code to main.

