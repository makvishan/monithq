# Quick Gradient Reference Guide

## When to Use Each Gradient Class

### 🎨 **gradient-text**
**Purpose**: Colorful gradient text effect  
**Use for**:
- Page titles and main headings (h1, h2)
- Important labels and stat values
- Brand name "MonitHQ"
- Section headings that need emphasis

**Example**:
```jsx
<h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
<p className="text-4xl font-bold gradient-text">99.8%</p>
```

---

### 🚀 **gradient-ai**
**Purpose**: Primary AI-themed gradient background  
**Use for**:
- Call-to-action buttons
- Primary action buttons
- Active navigation states
- Icon backgrounds
- Logo backgrounds
- User avatars

**Example**:
```jsx
<button className="px-4 py-2 gradient-ai text-white">
  Add Site
</button>
<div className="w-12 h-12 gradient-ai rounded-lg">
  <Icon className="w-6 h-6 text-white" />
</div>
```

---

### ✨ **gradient-primary**
**Purpose**: Standard gradient from indigo to purple  
**Use for**:
- Less prominent buttons
- Card backgrounds
- Feature highlights
- Secondary elements

**Example**:
```jsx
<Card className="gradient-primary">
  <CardContent>...</CardContent>
</Card>
```

---

### 🌈 **gradient-cyber**
**Purpose**: Futuristic cyan to purple gradient  
**Use for**:
- Tech-focused sections
- Special announcements
- Advanced features
- Experimental UI elements

**Example**:
```jsx
<div className="p-6 gradient-cyber rounded-lg">
  <h3>Advanced AI Features</h3>
</div>
```

---

### 🔄 **gradient-animated**
**Purpose**: Animated gradient with shifting colors  
**Use for**:
- Hero sections
- CTA sections
- Attention-grabbing backgrounds
- Special promotional areas

**Example**:
```jsx
<section className="py-20 gradient-animated">
  <h2>Ready to get started?</h2>
</section>
```

---

### 🔲 **gradient-border**
**Purpose**: Gradient border effect  
**Use for**:
- Important cards (pricing plans, AI insights)
- Premium features
- Highlighted content
- Special badges

**Example**:
```jsx
<Card className="gradient-border">
  <CardHeader>Most Popular</CardHeader>
</Card>
```

---

### 💎 **glass-gradient**
**Purpose**: Glass morphism with gradient overlay  
**Use for**:
- AI insight cards
- Overlay panels
- Modal backgrounds
- Floating elements

**Example**:
```jsx
<div className="glass-gradient p-4 rounded-lg">
  🤖 AI Summary: Your site performance...
</div>
```

---

## Glow Effects

### ⭐ **glow-primary**
**Purpose**: Subtle glow effect  
**Use for**:
- Stat cards
- Icon containers
- Standard hover states
- Gentle emphasis

**Example**:
```jsx
<Card className="glow-primary">
  <CardContent>Total Sites: 12</CardContent>
</Card>
```

---

### 🌟 **glow-secondary**
**Purpose**: Secondary color glow  
**Use for**:
- Alternative emphasis
- Secondary CTAs
- Supporting elements

**Example**:
```jsx
<button className="glow-secondary">Learn More</button>
```

---

### 💫 **glow-ai**
**Purpose**: Strong AI-themed glow  
**Use for**:
- Primary CTAs
- Logo
- Active states
- Key interactive elements
- Brand elements

**Example**:
```jsx
<button className="gradient-ai glow-ai">
  Start Free
</button>
```

---

## Common Combinations

### 1. Primary CTA Button
```jsx
<button className="gradient-ai text-white glow-ai hover:opacity-90">
  Get Started
</button>
```

### 2. Stat Card
```jsx
<Card className="glow-primary">
  <CardContent>
    <p className="gradient-text text-3xl">12</p>
  </CardContent>
</Card>
```

### 3. Icon Container
```jsx
<div className="w-12 h-12 gradient-ai rounded-lg glow-primary">
  <Icon className="w-6 h-6 text-white" />
</div>
```

### 4. Featured Card
```jsx
<Card className="gradient-border glow-ai">
  <CardHeader>
    <CardTitle className="gradient-text">Premium Plan</CardTitle>
  </CardHeader>
</Card>
```

### 5. Hero Section
```jsx
<section className="gradient-animated py-20">
  <h1 className="gradient-text">MonitHQ</h1>
  <button className="gradient-ai glow-ai">Start Now</button>
</section>
```

### 6. AI Insight Box
```jsx
<div className="glass-gradient border gradient-border p-4">
  <p className="gradient-text">AI Analysis</p>
  <p>Your insights here...</p>
</div>
```

### 7. Logo
```jsx
<div className="gradient-ai glow-ai w-10 h-10 rounded-lg">
  <span className="text-white font-bold">M</span>
</div>
<span className="gradient-text font-bold">MonitHQ</span>
```

### 8. Active Navigation
```jsx
<Link className="gradient-ai text-white glow-primary">
  Dashboard
</Link>
```

---

## Do's and Don'ts

### ✅ Do:
- Use `gradient-text` for headings and important numbers
- Combine `gradient-ai` with `glow-ai` for CTAs
- Add `glow-primary` to cards for subtle depth
- Use `gradient-animated` sparingly for hero sections
- Combine gradient classes with appropriate text colors

### ❌ Don't:
- Overuse gradients (not every element needs one)
- Use multiple gradient backgrounds on nested elements
- Forget to set text color to white on gradient backgrounds
- Stack multiple glow effects (choose one)
- Use `gradient-animated` everywhere (performance impact)

---

## Accessibility Tips

1. **Text Contrast**: Always ensure text on gradients meets WCAG AA standards
   - Use white text on dark gradients
   - Test in both light and dark modes

2. **Focus States**: Add focus rings to interactive gradient elements
   ```jsx
   className="gradient-ai focus:ring-2 focus:ring-offset-2"
   ```

3. **Reduced Motion**: Consider users with motion preferences
   - CSS automatically respects `prefers-reduced-motion`

---

## Browser DevTools Testing

Test your gradients:
1. **Chrome DevTools**: Inspect > Computed > See gradient values
2. **Firefox**: Inspect > Layout > Gradient inspector
3. **Safari**: Inspect > Styles > Gradient visualization

---

**Quick Reference**: Use this guide when adding new components to maintain consistent AI-themed design throughout MonitHQ!
