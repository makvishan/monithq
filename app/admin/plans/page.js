'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Globe,
  Clock,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (planData) => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const url = planData.id 
        ? `/api/admin/plans/${planData.id}`
        : '/api/admin/plans';
      
      const method = planData.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        setSuccess(planData.id ? 'Plan updated successfully!' : 'Plan created successfully!');
        setEditingPlan(null);
        setShowAddDialog(false);
        await fetchPlans();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      setError('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('Plan deleted successfully!');
        await fetchPlans();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.details || data.error || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Failed to delete plan');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (cents) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MainContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </MainContent>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MainContent>
        <div className=" max-w-7xl mx-auto space-y-6">
          {/* Success/Error Messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {success}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Plans Management</h1>
              <p className="text-muted-foreground mt-1">Manage subscription tiers and pricing (cache auto-clears on save)</p>
            </div>
            <button
              onClick={() => setShowAddDialog(true)}
              disabled={saving}
              className="px-4 py-2 gradient-ai text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Plan
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Plans</p>
                    <p className="text-2xl font-bold text-foreground">{plans.length}</p>
                  </div>
                  <div className="p-3 gradient-info rounded-lg glow-info">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Plans</p>
                    <p className="text-2xl font-bold text-foreground">
                      {plans.filter(p => p.isActive).length}
                    </p>
                  </div>
                  <div className="p-3 gradient-success rounded-lg glow-success">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Price Range</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatPrice(Math.min(...plans.filter(p => p.price > 0).map(p => p.price)))} - {formatPrice(Math.max(...plans.map(p => p.price)))}
                    </p>
                  </div>
                  <div className="p-3 gradient-secondary rounded-lg glow-secondary">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Popular Plan</p>
                    <p className="text-2xl font-bold text-foreground">
                      {plans.find(p => p.isPopular)?.displayName || 'None'}
                    </p>
                  </div>
                  <div className="p-3 gradient-warning rounded-lg glow-warning">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plans Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Plan</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Price</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Limits</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Features</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {plan.isPopular && <Zap className="w-4 h-4 text-warning" />}
                            <div>
                              <div className="font-semibold text-foreground">{plan.displayName}</div>
                              <div className="text-xs text-muted-foreground">{plan.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-foreground">{formatPrice(plan.price)}</span>
                          {plan.price > 0 && <span className="text-xs text-muted-foreground">/mo</span>}
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Sites: {plan.maxSites === -1 ? '∞' : plan.maxSites}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Team: {plan.maxTeamMembers === -1 ? '∞' : plan.maxTeamMembers}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {plan.minCheckInterval}s intervals
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">
                            {plan.features.length} features
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            plan.isActive ? 'gradient-success' : 'bg-muted'
                          } text-white`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingPlan(plan)}
                              disabled={saving}
                              className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                              title="Edit plan"
                            >
                              <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              disabled={saving || plan.name === 'FREE'}
                              className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                              title={plan.name === 'FREE' ? 'Cannot delete FREE plan' : 'Delete plan'}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-danger" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Edit/Add Plan Dialog */}
          {(editingPlan || showAddDialog) && (
            <PlanEditDialog
              plan={editingPlan}
              onClose={() => {
                setEditingPlan(null);
                setShowAddDialog(false);
              }}
              onSave={handleSavePlan}
              saving={saving}
            />
          )}
        </div>
      </MainContent>
    </div>
  );
}

// Plan Edit Dialog Component
function PlanEditDialog({ plan, onClose, onSave, saving }) {
  const [formData, setFormData] = useState(plan || {
    name: '',
    displayName: '',
    description: '',
    price: 0,
    stripePriceId: '',
    maxSites: 3,
    maxTeamMembers: 3,
    minCheckInterval: 300,
    maxAICredits: 0,
    allowedChannels: ['email'],
    features: [],
    isActive: true,
    isPopular: false,
    sortOrder: 0,
  });

  const [featureInput, setFeatureInput] = useState('');
  const [validatingStripe, setValidatingStripe] = useState(false);
  const [stripeValidation, setStripeValidation] = useState(null);

  // Validate Stripe price when price or stripePriceId changes
  useEffect(() => {
    const validateStripe = async () => {
      // Skip validation if no Stripe Price ID or if price is 0 (FREE plan)
      if (!formData.stripePriceId || formData.stripePriceId.trim() === '' || formData.price === 0) {
        setStripeValidation(null);
        return;
      }

      setValidatingStripe(true);
      setStripeValidation(null);

      try {
        const response = await fetch('/api/admin/plans/validate-stripe-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stripePriceId: formData.stripePriceId,
            expectedAmount: formData.price,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setStripeValidation({
            valid: true,
            message: data.message,
          });
        } else {
          setStripeValidation({
            valid: false,
            error: data.error,
            actualAmount: data.actualAmount,
          });
        }
      } catch (error) {
        setStripeValidation({
          valid: false,
          error: 'Failed to validate Stripe price',
        });
      } finally {
        setValidatingStripe(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateStripe, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.stripePriceId, formData.price]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const toggleChannel = (channel) => {
    const channels = formData.allowedChannels || [];
    if (channels.includes(channel)) {
      setFormData({
        ...formData,
        allowedChannels: channels.filter(c => c !== channel),
      });
    } else {
      setFormData({
        ...formData,
        allowedChannels: [...channels, channel],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg max-w-3xl w-full my-8"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-foreground">
              {plan ? 'Edit Plan' : 'Add New Plan'}
            </h2>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Plan Name (UPPERCASE) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="FREE, STARTER, PRO..."
                  required
                  disabled={!!plan}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="Free Plan"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                rows="2"
                placeholder="Plan description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Price (in cents) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="0, 2900, 9900..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ${(formData.price / 100).toFixed(2)} USD
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stripe Price ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.stripePriceId}
                    onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                    className={`w-full px-4 py-2 bg-background border rounded-lg text-foreground pr-10 ${
                      stripeValidation?.valid === false 
                        ? 'border-red-500' 
                        : stripeValidation?.valid === true 
                        ? 'border-green-500' 
                        : 'border-border'
                    }`}
                    placeholder="price_..."
                  />
                  {validatingStripe && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  {!validatingStripe && stripeValidation?.valid === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  {!validatingStripe && stripeValidation?.valid === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                {stripeValidation?.valid === true && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {stripeValidation.message}
                  </p>
                )}
                {stripeValidation?.valid === false && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {stripeValidation.error}
                    </p>
                    {stripeValidation.actualAmount && (
                      <p className="text-xs text-muted-foreground">
                        Stripe has: ${(stripeValidation.actualAmount / 100).toFixed(2)} | You entered: ${(formData.price / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
                {!formData.stripePriceId && formData.price === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for FREE plans
                  </p>
                )}
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Sites
                </label>
                <input
                  type="number"
                  value={formData.maxSites}
                  onChange={(e) => setFormData({ ...formData, maxSites: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="3, 10, 999999 (unlimited)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Team Members
                </label>
                <input
                  type="number"
                  value={formData.maxTeamMembers}
                  onChange={(e) => setFormData({ ...formData, maxTeamMembers: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="3, 5, 999999 (unlimited)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Min Check Interval (seconds)
                </label>
                <input
                  type="number"
                  value={formData.minCheckInterval}
                  onChange={(e) => setFormData({ ...formData, minCheckInterval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="10, 30, 60, 300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max AI Credits
                </label>
                <input
                  type="number"
                  value={formData.maxAICredits}
                  onChange={(e) => setFormData({ ...formData, maxAICredits: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="0, 1000, 999999 (unlimited)"
                />
              </div>
            </div>

            {/* Allowed Channels */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Allowed Notification Channels
              </label>
              <div className="flex gap-3 flex-wrap">
                {['email', 'slack', 'sms', 'webhook'].map(channel => (
                  <label key={channel} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.allowedChannels || []).includes(channel)}
                      onChange={() => toggleChannel(channel)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Features
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="Add a feature..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-accent px-3 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="flex-1 text-sm text-foreground">{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-foreground">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-foreground">Popular</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="0, 1, 2..."
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || validatingStripe || (stripeValidation?.valid === false)}
              className="px-4 py-2 gradient-ai text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : validatingStripe ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : stripeValidation?.valid === false ? (
                <>
                  <XCircle className="w-4 h-4" />
                  Fix Stripe Price
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {plan ? 'Update Plan' : 'Create Plan'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
