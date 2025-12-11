# 🤝 Contributing to Guardon

**Help make Kubernetes security accessible to every developer!**

Thanks for your interest in contributing! Guardon is built by developers, for developers, and we welcome contributions from security experts, frontend developers, extension enthusiasts, and Kubernetes newcomers alike.

## 🌟 Why Contribute?

- **🚀 Impact thousands of developers** — Guardon helps teams catch security issues before they hit production
- **🔧 Learn cutting-edge tech** — Work with Chrome extensions, Kubernetes YAML parsing, and security tooling
- **🏆 Build your portfolio** — Contribute to a project that solves real-world security problems
- **👥 Join a welcoming community** — We mentor new contributors and celebrate every contribution
- **📈 Level up your skills** — From beginner-friendly issues to advanced features, grow at your own pace

## 🎯 How Your Contributions Make a Difference

Every contribution helps developers worldwide write more secure Kubernetes manifests:
- **New security rules** → Prevent production incidents
- **UX improvements** → Make security checks effortless  
- **Bug fixes** → Keep the extension reliable
- **Documentation** → Help others contribute and use Guardon effectively

## 🚀 Quick Start for Contributors

**New to the project?** Here's how to get started in 5 minutes:

1. **🍴 Fork the repository** and clone it locally
2. **🔧 Load the extension** in Chrome (`chrome://extensions` → Developer mode → Load unpacked)
3. **🧪 Run tests** with `npm install && npm test`
4. **🎯 Pick an issue** from our [good first issues](https://github.com/guardon-dev/guardon/labels/good-first-issue)

**Feeling ambitious?** Check out our [Contributing Issues Guide](./CONTRIBUTING_ISSUES.md) for 10 ready-to-tackle issues!

## 🏷️ Find Your Perfect Issue

| 🟢 **Beginner** | 🟡 **Intermediate** | 🔴 **Advanced** |
|-----------------|---------------------|-----------------|
| Add security rules | Refactor components | Build integrations |
| Fix documentation | Improve UX/UI | Add platform support |
| Write tests | Performance optimization | Architecture changes |

**🎁 Bonus:** First-time contributors get a special mention in our release notes!

## 🐛 How to File Outstanding Bug Reports

**Great bug reports save everyone time!** Include:

- **🎯 Clear reproduction steps** — Help us reproduce the issue quickly
- **📱 Environment details** — Browser version, OS, extension version  
- **📋 YAML examples** — Minimal examples that trigger the bug
- **🔍 Console logs** — Open DevTools for the popup and paste relevant errors
- **💡 Expected vs actual behavior** — What should have happened?

**💎 Pro tip:** Screenshots and GIFs make bug reports incredibly helpful!

## 💡 Feature Requests That Get Built

We love feature requests that:

- **📊 Include user research** — How many users would benefit?
- **🔧 Propose solutions** — Not just problems, but ideas for solving them
- **🎨 Include mockups** — Visual ideas help us understand your vision
- **⚡ Focus on impact** — How does this make Guardon better for everyone?

**🌟 Most requested features:**
- VS Code integration
- GitLab/Bitbucket support  
- Custom rule templates
- Performance monitoring

## 🛠️ Development Workflow (Streamlined!)

```bash
# 1. Get the code
git clone https://github.com/[your-username]/guardon.git
cd guardon

# 2. Create your feature branch  
git checkout -b feature/amazing-new-feature

# 3. Set up development environment
npm install                    # Install test dependencies
# Load extension in chrome://extensions (Developer mode → Load unpacked)

# 4. Make your changes and test
npm test                      # Run unit tests
# Test manually in browser

# 5. Commit with DCO sign-off
git commit -s -m "feat: add amazing new feature"

# 6. Push and create PR
git push origin feature/amazing-new-feature
```

**🎯 Development tips:**
- **Hot reload**: Changes to popup/options reload automatically
- **Debugging**: Right-click extension icon → "Inspect popup" for DevTools
- **Testing**: Focus on `src/utils/` modules where most logic lives

## Code Quality and Linting

Guardon uses [ESLint](https://eslint.org/) to check for code quality errors and common mistakes in all JavaScript files. Please run ESLint before submitting a pull request:

```
npx eslint .
```

All major changes should include new or updated tests. See the ROADMAP.md for our commitment to test coverage.

## 🏆 Pull Request Excellence

**What makes a PR mergeable:**

✅ **The Good Stuff:**
- 🎯 **Focused scope** — One feature/fix per PR
- 🧪 **Tests included** — Cover new behavior and edge cases  
- 📝 **Clear description** — What, why, and how
- 💬 **Descriptive commits** — Future you will thank present you
- 🔍 **Self-review** — Check your own code first

✅ **Bonus points:**
- 📚 **Documentation updates** if you change user-facing behavior
- 🖼️ **Screenshots/GIFs** for UI changes
- ⚡ **Performance considerations** noted
- 🛡️ **Security implications** addressed

**🚀 Fast-track to approval:**
- Reference the issue you're fixing
- Add "Fixes #123" to auto-close issues
- Keep PRs under 400 lines when possible
- Respond to feedback promptly

**⏱️ Review timeline:** We aim to review PRs within 2-3 business days!

## ✍️ Developer Certificate of Origin (DCO)

**TL;DR:** Add `-s` to your git commits to certify you have the right to contribute.

```bash
git commit -s -m "feat: awesome new security rule"
```

This project uses the Developer Certificate of Origin (DCO) to ensure all contributions are properly licensed. By adding the sign-off, you certify:

- ✅ You wrote the code or have the right to submit it
- ✅ You understand it will be distributed under the Apache 2.0 license
- ✅ You're not introducing any legal issues

**Need help with DCO?** Open an issue and we'll guide you through it!

## 🧪 Testing Made Easy

**Run the full test suite:**
```bash
npm install    # One-time setup
npm test       # Run all tests with coverage
```

**Testing philosophy:**
- 🎯 **Focus on utilities** — Most tests are in `src/utils/` modules
- 🔧 **Test behavior, not implementation** — What should happen, not how
- 🐛 **Cover edge cases** — Malformed YAML, missing fields, etc.
- 📊 **Maintain coverage** — Aim for >80% on new code

**Need help with tests?** Check out `tests/rulesEngine.test.js` for examples!

## 🎨 Repository Assets & Documentation

**Architecture diagrams:**
- Edit `assets/architecture-diagram.svg` for conceptual changes
- PNG is auto-generated from SVG via GitHub Actions
- Include updated diagrams in PRs when changing architecture

**Documentation updates:**
- 📝 README changes for user-facing features
- 🔧 Update copilot-instructions.md for new development patterns
- 📚 Add JSDoc comments for complex functions

## 🌈 Community & Recognition

### 🏅 Contributor Badges & Achievements

**Earn recognition for your contributions! We celebrate every milestone:**

| Badge | Achievement | How to Earn |
|-------|------------|-------------|
| � **First Timer** | Your first merged PR | Submit and get your first pull request merged |
| 🐛 **Bug Hunter** | Fixed a confirmed bug | Submit a PR that fixes a reported bug |
| 🔒 **Security Champion** | Added security rules | Contribute new security rules or improve existing ones |
| 🎨 **UX Enhancer** | Improved user experience | Make UI/UX improvements that users love |
| 🧪 **Test Master** | Boosted test coverage | Add comprehensive tests that improve coverage |
| 📚 **Documentation Hero** | Enhanced documentation | Improve docs, guides, or help materials |
| 🤖 **AI Pioneer** | Built AI features | Contribute to AI-powered functionality |
| 🏗️ **Architecture Architect** | Made structural improvements | Refactor code or improve system design |
| 💎 **Code Quality Guardian** | Improved code standards | Add linting, formatting, or quality improvements |
| 🚀 **Performance Optimizer** | Enhanced performance | Make measurable performance improvements |
| 🌍 **Platform Expander** | Added platform support | Extend support to new platforms (GitLab, VS Code, etc.) |
| 👑 **Top Contributor** | 10+ merged PRs | Achieve 10 or more merged contributions |

**🎖️ Special Recognition:**
- **⭐ Monthly MVP**: Most impactful contributor each month
- **🏆 Annual Champion**: Outstanding contributions throughout the year
- **🎯 Problem Solver**: Tackle and solve complex, long-standing issues
- **🧑‍🏫 Mentor**: Help guide and support new contributors

### 🎁 **Contributor Rewards**

**📜 GitHub Profile Features:**
- ✅ **README Hall of Fame** with your GitHub profile and contributions
- 🔗 **Personal project links** in our contributor showcase
- 📊 **Contribution stats** highlighting your impact

**📢 Social Media Shoutouts:**
- 🐦 **Twitter features** celebrating your contributions
- 💼 **LinkedIn endorsements** for your open source work
- 📝 **Blog post features** about significant contributions

**🎯 Career Benefits:**
- 📋 **Recommendation letters** for outstanding contributors
- 🗣️ **Conference talk opportunities** about your Guardon work
- 🤝 **Professional references** from project maintainers
- 🎤 **Podcast appearances** discussing your contributions

**🏢 Maintainer Track:**
- 👥 **Maintainer nomination** for consistent, high-quality contributions
- 🔑 **Repository access** and decision-making responsibilities
- 🎯 **Project direction input** on roadmap and feature priorities
- 📅 **Community leadership** opportunities

**🎁 Bonus perks:**
- 🏆 **Release notes mention** — Credit in release announcements  
- 📝 **Release notes mention** — Credit in release announcements  
- 🎁 **Maintainer nomination** — Active contributors can become maintainers
- 📢 **Social media shoutouts** — We love promoting our contributors!

**💬 Get support:**
- 💭 [GitHub Discussions](https://github.com/guardon-dev/guardon/discussions) for questions
- 🐛 [Issues](https://github.com/guardon-dev/guardon/issues) for bugs and features
- 📧 Email maintainers for security issues

**📜 Code of Conduct:**
We're committed to a welcoming, inclusive community. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) — we take it seriously and appreciate contributors who do too.

---

## 🚀 Ready to Contribute?

1. **⭐ Star the repo** if you haven't already
2. **🔍 Browse [good first issues](https://github.com/guardon-dev/guardon/labels/good-first-issue)**
3. **💬 Comment on an issue** to claim it
4. **🛠️ Start coding** and make Kubernetes security better for everyone!

**Questions?** Don't hesitate to ask — we're here to help you succeed! 🎯
