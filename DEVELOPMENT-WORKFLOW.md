# Development Workflow Guide

## 🚀 Development Branch Workflow

This project uses `refactor/complete-modularization` as the **development branch** and `main` as the **production branch**.

### Daily Development Workflow

#### 1. **Start Development**
```bash
# Always start from the development branch
git checkout refactor/complete-modularization
git pull origin refactor/complete-modularization
```

#### 2. **Make Changes**
- Make your code changes
- Test locally if possible
- Commit frequently with descriptive messages

#### 3. **Commit and Push to Development**
```bash
git add .
git commit -m "Description of changes"
git push origin refactor/complete-modularization
```

#### 4. **Automatic Deployment**
- Netlify will automatically deploy from `refactor/complete-modularization`
- Check the deployment URL for testing
- Verify everything works as expected

### Production Release Workflow

#### 1. **When Ready for Production**
```bash
# Switch to main branch
git checkout main
git pull origin main

# Merge development branch
git merge refactor/complete-modularization

# Push to production
git push origin main
```

#### 2. **Production Deployment**
- Netlify will deploy from `main` (if configured)
- Or manually trigger production deployment

### Branch Structure

- **`refactor/complete-modularization`** → Development/Testing
- **`main`** → Production/Stable

### Benefits of This Workflow

✅ **Safe Development**: Test changes without affecting production  
✅ **Continuous Deployment**: Development branch auto-deploys for testing  
✅ **Stable Production**: Main branch remains stable  
✅ **Easy Rollback**: Can quickly revert production if needed  

### Netlify Configuration

**Development Branch**: `refactor/complete-modularization`  
**Production Branch**: `main` (when ready for release)

### Tips

- Always test on the development deployment before merging to main
- Use descriptive commit messages
- Keep commits small and focused
- Document any breaking changes

