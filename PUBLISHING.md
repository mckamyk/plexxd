# Publishing Guide for @mckamyk/plexxd

## Package Information

- **Name**: `@mckamyk/plexxd`
- **Version**: 1.0.0
- **Binary Size**: 64MB
- **Package Size**: ~24MB (compressed)

## Pre-Publishing Checklist

✅ Project renamed from termplex to plexxd
✅ package.json updated with scoped name and npm metadata
✅ Binary name updated to `plexxd`
✅ README updated with new name and installation instructions
✅ LICENSE file added (MIT)
✅ .npmignore configured
✅ .gitignore configured
✅ Binary compiled successfully

## Files Included in Package

- `plexxd` (64MB binary)
- `README.md`
- `LICENSE`
- `package.json`

## Publishing Steps

### 1. Login to npm

```bash
npm login
# Enter credentials for npm account that has access to @mckamyk scope
```

### 2. Test Package Locally (Optional)

```bash
# Create a tarball to inspect
npm pack

# Install locally in another project to test
npm install -g ./mckamyk-plexxd-1.0.0.tgz
plexxd
```

### 3. Publish to npm

```bash
# Publish as public package
npm publish --access public

# Or for first-time scoped package
npm publish --access public
```

### 4. Verify Publication

```bash
# Check it's available
npm view @mckamyk/plexxd

# Try installing
npm install -g @mckamyk/plexxd
plexxd --version
```

## Post-Publishing

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - v1.0.0"
   git branch -M main
   git remote add origin https://github.com/mckamyk/plexxd.git
   git push -u origin main
   ```

2. **Create GitHub Release**
   - Tag: `v1.0.0`
   - Title: "Plexxd v1.0.0 - Initial Release"
   - Upload platform-specific binaries:
     - `plexxd-darwin-arm64`
     - `plexxd-linux-x64`
     - `plexxd-windows-x64.exe`

3. **Build Cross-Platform Binaries**
   
   **Note**: Due to OpenTUI's native dependencies, you can only build for your current platform.
   Cross-platform binaries need to be built on their respective platforms (e.g., Linux binary on Linux).
   
   For now, publish with just macOS ARM64 binary:
   ```bash
   bun run build
   ```
   
   To build for other platforms, you'll need CI/CD (GitHub Actions):
   - Use runners: `macos-latest`, `ubuntu-latest`, `windows-latest`
   - Build on each platform
   - Upload as release artifacts

## Future Versions

To publish updates:

1. Update version in package.json
2. Update CHANGELOG (create if needed)
3. Rebuild binary: `bun run build`
4. Commit changes
5. Create git tag: `git tag v1.x.x`
6. Push: `git push && git push --tags`
7. Publish: `npm publish`
8. Create GitHub release with binaries

## Troubleshooting

### Binary not executable after install
The binary is marked as executable in the package. If users have issues:
```bash
chmod +x $(which plexxd)
```

### Package too large warning
The 64MB binary is large but necessary for self-contained distribution. 
Users can also download platform-specific binaries from GitHub releases.

### Scope permission denied
Ensure you have access to the @mckamyk scope:
- Contact scope owner
- Or create your own scope: `npm access grant read-write @yourscope youruser`

## Additional Notes

- The binary is built with Bun's `--compile` flag for single-file distribution
- Dependencies are bundled into the binary
- No runtime dependencies needed by users
- Cross-platform binaries can be built separately for distribution
