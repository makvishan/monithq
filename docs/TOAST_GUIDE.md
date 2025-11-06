# Toast Notifications Guide

Beautiful, colorized toast notifications are now available globally throughout the MonitHQ application.

## Usage

Import the toast utility in any component:

```javascript
import showToast from '@/lib/toast';
```

## Available Toast Types

### 1. Success Toast (Green)
```javascript
showToast.success('Operation completed successfully!');
showToast.success('Site added successfully', { duration: 3000 });
```

### 2. Error Toast (Red)
```javascript
showToast.error('Failed to save changes');
showToast.error(err.message || 'An error occurred');
```

### 3. Warning Toast (Orange)
```javascript
showToast.warning('Please fill in all required fields');
showToast.warning('API key will expire soon');
```

### 4. Info Toast (Blue)
```javascript
showToast.info('Processing your request...');
showToast.info('New features available!');
```

### 5. Loading Toast (Gray)
```javascript
const loadingToast = showToast.loading('Saving changes...');
// Later dismiss it:
showToast.dismiss(loadingToast);
```

### 6. Promise Toast (Automatic transitions)
```javascript
showToast.promise(
  fetchDataAPI(),
  {
    loading: 'Loading data...',
    success: 'Data loaded successfully!',
    error: 'Failed to load data',
  }
);
```

## Advanced Options

### Custom Duration
```javascript
showToast.success('Message', { duration: 5000 }); // 5 seconds
```

### Custom Position
```javascript
showToast.info('Message', { position: 'bottom-center' });
// Options: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
```

### Dismiss Toasts
```javascript
// Dismiss specific toast
const id = showToast.success('Message');
showToast.dismiss(id);

// Dismiss all toasts
showToast.dismissAll();
```

## Migration from alert()

### Before:
```javascript
alert('Site added successfully');
alert(err.message || 'Failed to save');
```

### After:
```javascript
showToast.success('Site added successfully');
showToast.error(err.message || 'Failed to save');
```

## Styling

Toasts are automatically styled with:
- Gradient backgrounds matching the type (success/error/warning/info)
- Rounded corners (8px radius)
- Drop shadows
- Icons (✓, ✗, ⚠️, ℹ️)
- Smooth animations (slide in/out)
- Position: top-right by default

## Examples in Code

### Form Submission
```javascript
const handleSubmit = async () => {
  if (!email) {
    showToast.warning('Please enter an email address');
    return;
  }

  try {
    await api.submitForm(email);
    showToast.success('Form submitted successfully!');
  } catch (err) {
    showToast.error(err.message || 'Submission failed');
  }
};
```

### API Calls with Promise Toast
```javascript
const saveSettings = () => {
  showToast.promise(
    api.updateSettings(data),
    {
      loading: 'Saving settings...',
      success: 'Settings saved!',
      error: 'Failed to save settings',
    }
  );
};
```

### Delete Confirmation
```javascript
const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return;

  try {
    await api.delete(id);
    showToast.success('Deleted successfully');
  } catch (err) {
    showToast.error('Failed to delete');
  }
};
```

## Color Scheme

- **Success**: `#10b981` (Green)
- **Error**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Orange)
- **Info**: `#3b82f6` (Blue)
- **Loading**: `#6b7280` (Gray)

All toasts use white text for maximum contrast and readability.
