import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should display the app name', async ({ page }) => {
    // Note: This test assumes authentication is configured
    // For a real test, you would need to mock or handle authentication
    await page.goto('/')

    // Check for the Eat branding (visible on both auth and main pages)
    await expect(page.locator('text=Eat')).toBeVisible()
  })

  test('should render the footer with copyright', async ({ page }) => {
    await page.goto('/')

    // Footer should be visible on all pages
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('text=/All rights reserved/i')).toBeVisible()
  })
})

test.describe('Inventory Page (unauthenticated)', () => {
  test('should redirect to home when not authenticated', async ({ page }) => {
    await page.goto('/inventory')

    // Should redirect to home which shows auth landing page
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('Recipes Page (unauthenticated)', () => {
  test('should redirect to home when not authenticated', async ({ page }) => {
    await page.goto('/recipes')

    // Should redirect to home which shows auth landing page
    await expect(page).toHaveURL(/\/$/)
  })
})
