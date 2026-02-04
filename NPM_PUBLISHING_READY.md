# 📦 @mckamyk/plexxd - Ready for NPM Publishing

## ✅ Package Status: READY

All files configured and tested for npm publishing.

### Package Details

- **Name**: `@mckamyk/plexxd`
- **Version**: 1.0.0
- **Package Size**: 23.7 MB (compressed)
- **Unpacked Size**: 66.6 MB

### Platform Support

**Currently Included:**
- ✅ macOS ARM64 (M1/M2/M3) - `plexxd-darwin-arm64` (64MB)

**Install Behavior:**
- On macOS ARM64: Copies `plexxd-darwin-arm64` to `plexxd` and makes executable
- On other platforms: Shows friendly message directing to GitHub releases

### Files in Package

```
@mckamyk/plexxd@1.0.0
├── install.cjs          (2.1KB) - Post-install script for platform detection
├── plexxd-darwin-arm64  (64MB)  - macOS ARM64 binary
├── package.json         (1.6KB) - Package metadata
├── README.md            (7.9KB) - Documentation
└── LICENSE              (1.1KB) - MIT License
```

### How It Works

1. **User installs**: `npm install -g @mckamyk/plexxd`
2. **postinstall runs**: `node install.cjs`
3. **Platform detection**: Checks `process.platform` and `process.arch`
4. **Binary selection**: 
   - macOS ARM64 → Copies `plexxd-darwin-arm64` to `plexxd`
   - Other platforms → Shows helpful message with download link
5. **Executable created**: Binary ready at `plexxd` command

## Publishing Commands

### 1. Final Package Preview

```bash
cd /Users/mac/code/plex2/plexxd
npm pack --dry-run
```

### 2. Login to NPM

```bash
npm login
# Enter credentials for account with @mckamyk scope access
```

### 3. Publish

```bash
npm publish --access public
```

### 4. Verify

```bash
npm view @mckamyk/plexxd
npm install -g @mckamyk/plexxd
plexxd  # Should work on macOS ARM64
```

## Post-Publishing Checklist

### Immediate Actions

- [ ] Verify package on npmjs.com: https://www.npmjs.com/package/@mckamyk/plexxd
- [ ] Test global install: `npm install -g @mckamyk/plexxd`
- [ ] Test npx: `npx @mckamyk/plexxd`
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Create v1.0.0 release

### GitHub Setup

```bash
cd /Users/mac/code/plex2/plexxd
git init
git add .
git commit -m "Initial release v1.0.0"
git branch -M main
git remote add origin https://github.com/mckamyk/plexxd.git
git push -u origin main
git tag v1.0.0
git push --tags
```

### Future: Cross-Platform Binaries

To support all platforms, you'll need CI/CD:

**GitHub Actions Example** (`.github/workflows/release.yml`):
```yaml
name: Build and Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - uses: actions/upload-artifact@v4
        with:
          name: binary-${{ matrix.os }}
          path: plexxd*
```

## User Installation Options

### Option 1: NPM (Works now for macOS ARM64)
```bash
npm install -g @mckamyk/plexxd
plexxd
```

### Option 2: Direct Binary Download (All platforms)
```bash
# macOS ARM64
curl -L -o plexxd https://github.com/mckamyk/plexxd/releases/latest/download/plexxd-darwin-arm64
chmod +x plexxd
./plexxd

# Linux x64 (when available)
curl -L -o plexxd https://github.com/mckamyk/plexxd/releases/latest/download/plexxd-linux-x64
chmod +x plexxd

# Windows (when available)
# Download plexxd-windows-x64.exe from releases
```

### Option 3: Build from Source (All platforms)
```bash
git clone https://github.com/mckamyk/plexxd.git
cd plexxd
bun install
bun run build
./plexxd
```

## Known Limitations

1. **Cross-platform builds**: OpenTUI has native dependencies that prevent cross-compilation
   - Current solution: Only macOS ARM64 binary in npm package
   - Workaround: Download platform-specific binaries from GitHub releases
   - Future solution: Use GitHub Actions to build on each platform

2. **Package size**: 23.7 MB compressed, 66.6 MB unpacked
   - Trade-off for self-contained binary with no runtime dependencies
   - Users who don't want npm package can download binary directly

## Success Criteria

✅ Package builds successfully  
✅ Install script detects platform correctly  
✅ Binary copies and becomes executable  
✅ Binary runs on macOS ARM64  
✅ Other platforms get helpful error message  
✅ README documents platform support  
✅ LICENSE included (MIT)  
✅ .npmignore configured  
✅ .gitignore configured  

## Ready to Publish! 🚀

The package is fully prepared and tested. Run:

```bash
npm publish --access public
```
