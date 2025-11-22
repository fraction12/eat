import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should display the app name in the navbar', async ({ page }) => {
    // Note: This test assumes authentication is configured
    // For a real test, you would need to mock or handle authentication
    await page.goto('/')

    // The app redirects to /auth/signin when not authenticated
    // Check if we're on the auth page or main page
    const url = page.url()

    if (url.includes('/auth')) {
      // On auth page, check for auth elements
      await expect(page.locator('text=Eat')).toBeVisible()
    } else {
      // On main page, check navbar
      await expect(page.locator('nav')).toBeVisible()
    }
  })

  test('should render the footer with copyright', async ({ page }) => {
    await page.goto('/')

    // Footer should be visible on all pages
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('text=/All rights reserved/i')).toBeVisible()
  })
})

test.describe('Inventory Page (unauthenticated)', () => {
  test('should redirect to signin when not authenticated', async ({ page }) => {
    await page.goto('/inventory')

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth\/signin/)
  })
})

test.describe('Recipes Page (unauthenticated)', () => {
  test('should redirect to signin when not authenticated', async ({ page }) => {
    await page.goto('/recipes')

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth\/signin/)
  })
})
