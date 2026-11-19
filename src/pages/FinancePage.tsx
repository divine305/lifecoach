import { useCallback } from 'react'
import { Navigate, NavLink, useLocation } from 'react-router-dom'
import { RecordWorkspace } from '../components/RecordWorkspace'
import { useAuth } from '../contexts/useAuth'
import { useOwnedRows } from '../lib/ownedRows'
import { optionalNumber, requiredNumber } from '../lib/formValues'
import { supabase } from '../lib/supabase'
import type { SavingsGoalRow } from '../types/database'

function FinanceTabs() {
  return (
    <nav className="workspace-tabs" aria-label="Finance sections">
      <NavLink to="/finance/transactions">Transactions</NavLink>
      <NavLink to="/finance/budgets">Budgets</NavLink>
      <NavLink to="/finance/savings">Savings goals</NavLink>
    </nav>
  )
}

function useCurrencyFormatter() {
  const { preferences } = useAuth()
  const currency = preferences?.preferred_currency ?? 'USD'
  return (amount: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}

function TransactionsPage() {
  const formatMoney = useCurrencyFormatter()
  const currency = useCurrencyCode()
  const loadTransactions = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('transaction_date', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadTransactions)

  const saveTransaction = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save transactions.')
    const amount = requiredNumber(values.amount, 'amount')
    if (amount <= 0) throw new Error('Amount must be greater than zero.')
    const transaction = {
      title: values.title.trim(),
      amount,
      transaction_type: values.transaction_type === 'income' ? 'income' as const : 'expense' as const,
      category: values.category.trim() || 'other',
      transaction_date: values.transaction_date || new Date().toISOString().slice(0, 10),
      description: values.description.trim() || null,
      payment_method: values.payment_method.trim() || null,
    }
    if (id) {
      const { data, error } = await supabase.from('transactions').update(transaction).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      updateRows((current) => current.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('transactions').insert({ ...transaction, user_id: userId }).select('*').single()
      if (error) throw error
      updateRows((current) => [data, ...current])
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete transactions.')
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    updateRows((current) => current.filter((row) => row.id !== id))
  }

  const income = rows.filter((row) => row.transaction_type === 'income').reduce((total, row) => total + row.amount, 0)
  const expenses = rows.filter((row) => row.transaction_type === 'expense').reduce((total, row) => total + row.amount, 0)

  return (
    <RecordWorkspace
      title="Transactions"
      description="Log income and spending manually. LifeOS does not connect to your bank."
      fields={[
        { name: 'title', label: 'Transaction', type: 'text', required: true },
        { name: 'amount', label: `Amount (${currency})`, type: 'number', required: true, min: 0.01, step: 0.01 },
        { name: 'transaction_type', label: 'Type', type: 'select', required: true, options: [{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }] },
        { name: 'category', label: 'Category', type: 'text', placeholder: 'Food, books, travel…' },
        { name: 'transaction_date', label: 'Date', type: 'date', required: true },
        { name: 'payment_method', label: 'Payment method', type: 'text', placeholder: 'Optional' },
        { name: 'description', label: 'Details', type: 'textarea' },
      ]}
      records={rows.map((transaction) => ({
        id: transaction.id,
        title: transaction.title,
        fields: {
          title: transaction.title,
          amount: String(transaction.amount),
          transaction_type: transaction.transaction_type,
          category: transaction.category,
          transaction_date: transaction.transaction_date,
          payment_method: transaction.payment_method ?? '',
          description: transaction.description ?? '',
        },
        subtitle: `${transaction.transaction_date} · ${transaction.category}`,
        detail: `${transaction.transaction_type === 'income' ? '+' : '−'}${formatMoney(transaction.amount)}`,
        status: transaction.transaction_type,
      }))}
      loading={loading}
      error={error}
      emptyMessage="No transactions recorded yet."
      submitLabel="Add transaction"
      onCreate={(values) => saveTransaction(null, values)}
      onUpdate={(id, values) => saveTransaction(id, values)}
      onDelete={deleteTransaction}
      onRetry={retry}
    >
      <FinanceTabs />
      <div className="workspace-metrics">
        <article><span>Income</span><strong>{loading ? '—' : formatMoney(income)}</strong></article>
        <article><span>Expenses</span><strong>{loading ? '—' : formatMoney(expenses)}</strong></article>
        <article><span>Net</span><strong>{loading ? '—' : formatMoney(income - expenses)}</strong></article>
      </div>
    </RecordWorkspace>
  )
}

function useCurrencyCode() {
  const { preferences } = useAuth()
  return preferences?.preferred_currency ?? 'USD'
}

function BudgetsPage() {
  const formatMoney = useCurrencyFormatter()
  const loadBudgets = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('budgets').select('*').eq('user_id', userId).order('period_start', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadBudgets)

  const saveBudget = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save budgets.')
    if (values.period_end < values.period_start) throw new Error('The end date must be on or after the start date.')
    const amount = requiredNumber(values.amount, 'budget amount')
    if (amount <= 0) throw new Error('Budget amount must be greater than zero.')
    const budget = {
      name: values.name.trim(),
      category: values.category.trim() || null,
      amount,
      period_start: values.period_start,
      period_end: values.period_end,
    }
    if (id) {
      const { data, error } = await supabase.from('budgets').update(budget).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      updateRows((current) => current.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('budgets').insert({ ...budget, user_id: userId }).select('*').single()
      if (error) throw error
      updateRows((current) => [data, ...current])
    }
  }

  const deleteBudget = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete budgets.')
    const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    updateRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <RecordWorkspace
      title="Budgets"
      description="Set a spending limit and date range for each budget."
      fields={[
        { name: 'name', label: 'Budget', type: 'text', required: true },
        { name: 'category', label: 'Category (optional)', type: 'text' },
        { name: 'amount', label: 'Limit', type: 'number', required: true, min: 0.01, step: 0.01 },
        { name: 'period_start', label: 'Starts', type: 'date', required: true },
        { name: 'period_end', label: 'Ends', type: 'date', required: true },
      ]}
      records={rows.map((budget) => ({
        id: budget.id,
        title: budget.name,
        fields: {
          name: budget.name,
          category: budget.category ?? '',
          amount: String(budget.amount),
          period_start: budget.period_start,
          period_end: budget.period_end,
        },
        subtitle: `${budget.period_start} – ${budget.period_end}${budget.category ? ` · ${budget.category}` : ''}`,
        detail: formatMoney(budget.amount),
      }))}
      loading={loading}
      error={error}
      emptyMessage="No budgets yet. Add one to set your own spending limit."
      submitLabel="Add budget"
      onCreate={(values) => saveBudget(null, values)}
      onUpdate={(id, values) => saveBudget(id, values)}
      onDelete={deleteBudget}
      onRetry={retry}
    >
      <FinanceTabs />
    </RecordWorkspace>
  )
}

function SavingsPage() {
  const formatMoney = useCurrencyFormatter()
  const loadGoals = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('savings_goals').select('*').eq('user_id', userId).order('target_date')
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadGoals)

  const saveSavingsGoal = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save savings goals.')
    const targetAmount = requiredNumber(values.target_amount, 'target amount')
    const currentAmount = optionalNumber(values.current_amount, 'current amount') ?? 0
    if (targetAmount <= 0 || currentAmount < 0) throw new Error('Enter valid savings amounts.')
    const goal = {
      title: values.title.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: values.target_date || null,
      status: savingsStatus(values.status),
    }
    if (id) {
      const { data, error } = await supabase.from('savings_goals').update(goal).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      updateRows((current) => current.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('savings_goals').insert({ ...goal, user_id: userId }).select('*').single()
      if (error) throw error
      updateRows((current) => [data, ...current])
    }
  }

  const deleteSavingsGoal = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete savings goals.')
    const { error } = await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    updateRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <RecordWorkspace
      title="Savings goals"
      description="Track savings progress with amounts you enter yourself."
      fields={[
        { name: 'title', label: 'Goal', type: 'text', required: true },
        { name: 'target_amount', label: 'Target amount', type: 'number', required: true, min: 0.01, step: 0.01 },
        { name: 'current_amount', label: 'Saved so far', type: 'number', min: 0, step: 0.01 },
        { name: 'target_date', label: 'Target date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'completed', label: 'Completed' },
        ] },
      ]}
      records={rows.map((goal) => ({
        id: goal.id,
        title: goal.title,
        fields: {
          title: goal.title,
          target_amount: String(goal.target_amount),
          current_amount: String(goal.current_amount),
          target_date: goal.target_date ?? '',
          status: goal.status,
        },
        subtitle: `${formatMoney(goal.current_amount)} of ${formatMoney(goal.target_amount)}${goal.target_date ? ` · target ${goal.target_date}` : ''}`,
        status: goal.status,
      }))}
      loading={loading}
      error={error}
      emptyMessage="No savings goals yet."
      submitLabel="Add savings goal"
      onCreate={(values) => saveSavingsGoal(null, values)}
      onUpdate={(id, values) => saveSavingsGoal(id, values)}
      onDelete={deleteSavingsGoal}
      onRetry={retry}
    >
      <FinanceTabs />
    </RecordWorkspace>
  )
}

function savingsStatus(value: string): SavingsGoalRow['status'] {
  if (value === 'paused' || value === 'completed') return value
  return 'active'
}

export function FinancePage() {
  const { pathname } = useLocation()
  if (pathname === '/finance') return <Navigate to="/finance/transactions" replace />
  if (pathname.endsWith('/budgets')) return <BudgetsPage />
  if (pathname.endsWith('/savings')) return <SavingsPage />
  return <TransactionsPage />
}
