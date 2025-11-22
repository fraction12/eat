import { categorizeItem, getDaysOld } from '@/utils/inventory'

describe('categorizeItem', () => {
  it('should categorize produce items correctly', () => {
    expect(categorizeItem('apple')).toBe('produce')
    expect(categorizeItem('Banana')).toBe('produce')
    expect(categorizeItem('Fresh tomatoes')).toBe('produce')
    expect(categorizeItem('organic lettuce')).toBe('produce')
  })

  it('should categorize dairy items correctly', () => {
    expect(categorizeItem('milk')).toBe('dairy')
    expect(categorizeItem('Cheddar Cheese')).toBe('dairy')
    expect(categorizeItem('Greek yogurt')).toBe('dairy')
    expect(categorizeItem('dozen eggs')).toBe('dairy')
  })

  it('should categorize meat items correctly', () => {
    expect(categorizeItem('chicken')).toBe('meat')
    expect(categorizeItem('Ground beef')).toBe('meat')
    expect(categorizeItem('salmon fillet')).toBe('meat')
    expect(categorizeItem('turkey bacon')).toBe('meat')
  })

  it('should categorize bakery items correctly', () => {
    expect(categorizeItem('bread')).toBe('bakery')
    expect(categorizeItem('Whole wheat bagel')).toBe('bakery')
    expect(categorizeItem('croissant')).toBe('bakery')
  })

  it('should categorize frozen items correctly', () => {
    expect(categorizeItem('frozen pizza')).toBe('frozen')
    expect(categorizeItem('ice cream')).toBe('frozen')
    expect(categorizeItem('Frozen peas')).toBe('frozen')
  })

  it('should categorize condiments correctly', () => {
    expect(categorizeItem('ketchup')).toBe('condiments')
    expect(categorizeItem('Hot sauce')).toBe('condiments')
    expect(categorizeItem('olive oil')).toBe('condiments')
    expect(categorizeItem('soy sauce')).toBe('condiments')
  })

  it('should default to pantry for unknown items', () => {
    expect(categorizeItem('rice')).toBe('pantry')
    expect(categorizeItem('pasta')).toBe('pantry')
    expect(categorizeItem('unknown item')).toBe('pantry')
  })

  it('should use stored category from item object', () => {
    const item = {
      id: '1',
      item: 'apple',
      price: 2.99,
      quantity: 1,
      created_at: '2024-01-01',
      category: 'dairy' as const
    }
    expect(categorizeItem(item)).toBe('dairy')
  })

  it('should auto-categorize when item object has no category', () => {
    const item = {
      id: '1',
      item: 'banana',
      price: 1.99,
      quantity: 1,
      created_at: '2024-01-01'
    }
    expect(categorizeItem(item)).toBe('produce')
  })
})

describe('getDaysOld', () => {
  it('should return 0 for items created today', () => {
    const today = new Date().toISOString()
    expect(getDaysOld(today)).toBe(0)
  })

  it('should return 1 for items created yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(getDaysOld(yesterday.toISOString())).toBe(1)
  })

  it('should return correct number of days for older items', () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    expect(getDaysOld(fiveDaysAgo.toISOString())).toBe(5)
  })

  it('should handle ISO date strings correctly', () => {
    const date = '2024-01-01T00:00:00.000Z'
    const now = new Date()
    const created = new Date(date)
    const expectedDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    expect(getDaysOld(date)).toBe(expectedDays)
  })
})
