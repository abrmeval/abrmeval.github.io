# Git Commit Message Types Cheat Sheet

This cheat sheet summarizes the most common commit message types used in [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Use these prefixes to help make your project history clear, searchable, and automatable.

---

## Table of Commit Types

| Type      | When to Use                                         | Example Commit Message                  |
|-----------|-----------------------------------------------------|-----------------------------------------|
| **build** | Changes to build system, dependencies, or packaging | `build: update webpack config`          |
| **chore** | Routine tasks, maintenance, or non-code updates     | `chore: update .gitignore`              |
| **ci**    | Continuous integration configuration/scripts        | `ci: add code coverage step to CI`      |
| **docs**  | Documentation only (no code changes)                | `docs: add API usage guide`             |
| **feat**  | New feature for the user or API                     | `feat: add password reset`              |
| **fix**   | Bug fix                                             | `fix: correct typo in login`            |
| **perf**  | Performance improvements                            | `perf: optimize image loading`          |
| **refactor** | Code restructure, cleanup, no feature/bug change | `refactor: split utils.js into modules` |
| **revert** | Undo previous commit(s)                            | `revert: revert "feat: new navbar"`     |
| **style** | Formatting, linting, whitespace, no logic change    | `style: format code with prettier`      |
| **test**  | Add or update tests                                 | `test: add integration tests`           |

---

## Detailed Descriptions and Scenarios

### **build**
- Changes to build tools, dependencies, or scripts.
- _Example:_ `build: upgrade typescript to v5.3`

### **chore**
- Routine maintenance that doesn’t affect source code or tests.
- _Example:_ `chore: update license year`

### **ci**
- Editing CI configuration (GitHub Actions, Travis, CircleCI, etc.).
- _Example:_ `ci: run tests on Node 20 in CI`

### **docs**
- Documentation changes only.
- _Example:_ `docs: fix typo in README`

### **feat**
- Adding a new feature.
- _Example:_ `feat: allow users to upload avatars`

### **fix**
- Bug fixes.
- _Example:_ `fix: handle null error in payment flow`

### **perf**
- Improving performance.
- _Example:_ `perf: cache API responses for faster load times`

### **refactor**
- Code restructuring or cleanup (no user-facing change).
- _Example:_ `refactor: move validation logic to helper`

### **revert**
- Reverting previous commits.
- _Example:_ `revert: remove experimental UI changes`

### **style**
- Changes that only affect code formatting.
- _Example:_ `style: apply consistent quotation marks`

### **test**
- Adding or updating tests.
- _Example:_ `test: add coverage for edge cases in login`

---

## Best Practices

- **Use the correct type** for every commit to clarify its intent.
- **Keep the subject short** (≤ 50 characters).
- **Use the imperative mood** ("add", "fix", "update", not "added" or "fixing").
- **Add a detailed body** if more explanation is needed.
- **Reference issues/PRs** as needed, e.g., `Closes #42`.
- **Review your commits** with `git log --oneline` before pushing.

---

## References

- [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/)
- [Git Commit Message Guidelines (Chris Beams)](https://chris.beams.io/posts/git-commit/)
- [Official Git Documentation](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)

---

**Tip:**  
Consistent commit types make your project’s history easier to read, automate, and maintain!
