---
inclusion: always
---

# MikroTik Dashboard - Development Rules Overview

**Version:** 3.1  
**Last Updated:** January 20, 2026  
**Status:** Active

---

## 📚 RULES DOCUMENTATION

This directory contains comprehensive development rules for the MikroTik Dashboard project. All rules are **mandatory** and must be followed without exception.

### Rule Files

1. **[master-development-rules.md](./master-development-rules.md)** - Core development standards
   - Code quality and structure
   - TypeScript best practices
   - React & Next.js patterns
   - API design
   - Database & Prisma
   - Security guidelines
   - Testing & validation
   - Project-specific patterns
   - Performance optimization
   - Common pitfalls

2. **[comprehensive-ui-best-practices.md](./comprehensive-ui-best-practices.md)** - UI/UX design system
   - Layout & structure
   - Color system
   - Typography
   - Button system
   - Form system
   - Table system
   - Card system
   - Modal/dialog system
   - Notification system
   - Loading states
   - Icon system
   - Animation & transitions
   - Project-specific UI patterns
   - Performance optimization
   - Security checklist

3. **[responsive-design-rules.md](./responsive-design-rules.md)** - Mobile-first design
   - Screen size breakpoints
   - Mobile-first positioning
   - Touch target standards
   - Responsive typography
   - Panel responsive behavior
   - Spacing responsive rules
   - Navigation patterns
   - Map-specific rules
   - Performance optimization
   - Testing checklist
   - Common mobile issues
   - Critical mobile patterns

4. **[ui-design-rules.md](./ui-design-rules.md)** - ReactFlow map UI
   - Panel positioning (no overlapping)
   - Spacing standards
   - Button standards
   - Panel standards
   - Color standards
   - Typography standards
   - Performance rules
   - Responsive design
   - Accessibility
   - Permission-based UI
   - Fullscreen implementation
   - Click outside handler

5. **[task-completion-rules.md](./task-completion-rules.md)** - Quality assurance
   - Zero-error policy
   - Mandatory verification steps
   - getDiagnostics usage
   - Error response protocol
   - Task completion checklist

6. **[documentation-rules.md](./documentation-rules.md)** - Clean code policy
   - No documentation files outside rules
   - Code is the documentation
   - Self-documenting code principles
   - JSDoc and inline comments
   - Clean repository standards

---

## 🎯 CORE PRINCIPLES

### The Four Pillars
1. **ELEGANT** - Beautiful, professional, and intuitive
2. **EFFICIENT** - Fast, responsive, and optimized
3. **LIGHTWEIGHT** - Minimal resources, maximum performance
4. **UNIVERSAL** - Works flawlessly on all devices

### Golden Rules
- **NO EXCEPTIONS** - Rules are absolute
- **NO COMPROMISES** - Quality over speed
- **NO SHORTCUTS** - Do it right the first time
- **NO TECHNICAL DEBT** - Clean code always

---

## 🚀 QUICK START

### Before Starting Any Task

1. **Read relevant rules** - Understand what's expected
2. **Check existing patterns** - Follow established conventions
3. **Plan your approach** - Think before coding
4. **Write clean code** - Follow all standards
5. **Verify with diagnostics** - Ensure no errors
6. **Test thoroughly** - All devices and scenarios

### Development Workflow

```bash
# 1. Start development
# Read relevant rules first

# 2. Write code
# Follow all standards and patterns

# 3. Check for errors
# Use getDiagnostics on all modified files

# 4. Fix any issues
# Zero tolerance for errors

# 5. Test manually
# Mobile, tablet, desktop

# 6. Commit
# Use conventional commit messages
```

---

## 📋 CRITICAL CHECKLISTS

### Before Committing Code

- [ ] Code follows all rules in this directory
- [ ] No TypeScript errors (verified with getDiagnostics)
- [ ] No console.log statements
- [ ] All buttons have aria-label and title
- [ ] Responsive on all devices (mobile, tablet, desktop)
- [ ] No overlapping elements
- [ ] Performance optimized (no heavy effects)
- [ ] Accessibility compliant (WCAG AA)
- [ ] Security best practices followed
- [ ] Documentation updated (if needed)

### Before Deploying

- [ ] All tests pass
- [ ] Build succeeds without errors
- [ ] Lighthouse score > 90
- [ ] Works on low-end devices
- [ ] No memory leaks
- [ ] Bundle size acceptable (< 200KB initial)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Backup created
- [ ] Rollback plan ready

---

## 🎨 DESIGN SYSTEM QUICK REFERENCE

### Colors
```css
/* Primary */
--blue-600: #2563eb
--blue-700: #1d4ed8

/* Status */
--green-500: #10b981  /* UP */
--red-500: #ef4444    /* DOWN */
--gray-500: #6b7280   /* UNKNOWN */

/* Neutral */
--gray-50: #f9fafb
--gray-900: #111827
```

### Typography
```tsx
<h1 className="text-2xl md:text-3xl font-bold">
<p className="text-sm md:text-base">
<span className="text-xs md:text-sm">
```

### Spacing (4px base)
```tsx
p-2  // 8px
p-4  // 16px
p-6  // 24px
gap-2 // 8px
gap-4 // 16px
```

### Breakpoints
```
Mobile:  < 640px  (sm)
Tablet:  640-767px (sm-md)
Desktop: ≥ 768px  (md+)
```

---

## 🔧 COMMON PATTERNS

### API Route
```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await prisma.model.findMany()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Component with SWR
```typescript
export default function Component() {
  const { data, error, mutate } = useSWR('/api/endpoint', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true
  })
  
  if (!data && !error) return <Loading />
  if (error) return <Error />
  
  return <div>{/* Content */}</div>
}
```

### Responsive Button
```tsx
<button className="
  px-4 md:px-6 py-2.5
  bg-gradient-to-r from-blue-600 to-blue-700
  hover:from-blue-700 hover:to-blue-800
  text-white rounded-lg font-medium
  transition-all duration-200
  shadow-md hover:shadow-lg
  transform hover:scale-105
  disabled:opacity-50 disabled:cursor-not-allowed
" aria-label="Action" title="Action">
  Button Text
</button>
```

### Form with Validation
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})

const validate = () => {
  const newErrors: Record<string, string> = {}
  if (!field) newErrors.field = 'Field is required'
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!validate()) return
  // Submit logic
}
```

---

## 🐛 TROUBLESHOOTING

### TypeScript Errors
1. Run `getDiagnostics` on affected files
2. Check import statements
3. Verify type definitions
4. Regenerate Prisma client if needed: `npx prisma generate`
5. Wait 3-5 seconds for TypeScript server to update

### UI Overlapping Issues
1. Check panel positioning calculations
2. Verify marginTop values follow rules
3. Test on mobile (hamburger menu position)
4. Use browser DevTools to inspect z-index
5. Refer to ui-design-rules.md for correct positions

### Performance Issues
1. Check for unnecessary re-renders (React DevTools)
2. Verify useCallback/useMemo usage
3. Remove heavy effects (backdrop-blur, complex animations)
4. Optimize images (WebP, proper sizing)
5. Check bundle size (webpack-bundle-analyzer)

### Mobile Display Issues
1. Test on actual devices, not just browser resize
2. Verify touch targets are minimum 40x40px
3. Check hamburger menu positioning (top-4 right-4)
4. Ensure no horizontal scrolling
5. Test with slow 3G connection

---

## 📖 LEARNING RESOURCES

### Official Documentation
- [Next.js 14](https://nextjs.org/docs)
- [React 18](https://react.dev)
- [TypeScript 5](https://www.typescriptlang.org/docs)
- [Tailwind CSS 3](https://tailwindcss.com/docs)
- [Prisma 5](https://www.prisma.io/docs)
- [ReactFlow](https://reactflow.dev/docs)
- [SWR](https://swr.vercel.app/)

### Best Practices
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🤝 CONTRIBUTING

### Adding New Rules

1. Identify the need for a new rule
2. Discuss with team
3. Document clearly with examples
4. Update this README
5. Commit with descriptive message

### Updating Existing Rules

1. Identify outdated or incorrect rule
2. Propose changes with reasoning
3. Update rule file
4. Update version number
5. Update "Last Updated" date
6. Commit with changelog

---

## 📝 VERSION HISTORY

### Version 3.1 (January 20, 2026)
- Added documentation-rules.md - Clean code policy
- Enforced no documentation files outside .kiro/steering/
- Removed SETUP_STATUS.md, NETWATCH_CONFIGURATION.md, LAYOUT_DELETE_MOBILE.md
- Code is the documentation principle
- Self-documenting code standards

### Version 3.0 (January 19, 2026)
- Added project-specific patterns section
- Enhanced mobile-first responsive design rules
- Added fullscreen implementation guidelines
- Added click outside handler pattern
- Enhanced security checklist
- Added performance optimization checklist
- Updated all examples with accessibility attributes
- Added Indonesian date formatting pattern
- Enhanced role-based access control examples
- Added comprehensive troubleshooting section

### Version 2.0 (January 2026)
- Initial comprehensive rules documentation
- Established four pillars principle
- Created separate rule files for different concerns
- Added responsive design rules
- Added UI design rules for ReactFlow map
- Added task completion rules

---

## 🚨 IMPORTANT REMINDERS

### NEVER Do These:
1. ❌ Commit code with TypeScript errors
2. ❌ Skip getDiagnostics verification
3. ❌ Use 'any' type in TypeScript
4. ❌ Hardcode sensitive data
5. ❌ Create overlapping UI elements
6. ❌ Forget accessibility attributes
7. ❌ Use heavy effects on low-end devices
8. ❌ Skip mobile testing
9. ❌ Ignore security best practices
10. ❌ Write code without comments (for complex logic)
11. ❌ Create documentation files outside .kiro/steering/

### ALWAYS Do These:
1. ✅ Read relevant rules before starting
2. ✅ Follow established patterns
3. ✅ Write clean, readable code
4. ✅ Add accessibility attributes
5. ✅ Test on all devices
6. ✅ Verify with getDiagnostics
7. ✅ Optimize for performance
8. ✅ Document complex logic with inline comments
9. ✅ Use TypeScript strictly
10. ✅ Think about security
11. ✅ Keep repository clean (code only, no docs)

---

## 💡 PHILOSOPHY

**"Quality is not an act, it is a habit."** - Aristotle

Every line of code you write is:
- ✅ A reflection of your professionalism
- ✅ An investment in maintainability
- ✅ A commitment to excellence
- ✅ A gift to future developers

**Write code you'd be proud to show.**

---

## 📞 SUPPORT

If you have questions about these rules:
1. Read the relevant rule file thoroughly
2. Check existing code for examples
3. Refer to official documentation
4. Ask team members
5. Propose rule clarifications if needed

---

**Remember: These rules exist to ensure quality, consistency, and maintainability. Follow them religiously.**

**NO EXCEPTIONS. NO COMPROMISES.**
