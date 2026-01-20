'use server'

import { signIn } from '../../auth'
import { AuthError } from 'next-auth'

export async function authenticate(formData: FormData) {
  try {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const authError = error as AuthError
      switch (authError.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid username or password' }
        default:
          return { error: 'An error occurred. Please try again.' }
      }
    }
    // Handle other errors
    return { error: 'An unexpected error occurred' }
  }
}
