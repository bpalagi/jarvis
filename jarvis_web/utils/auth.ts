import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile, setUserInfo } from './api'

const defaultLocalUser: UserProfile = {
  uid: 'default_user',
  display_name: 'Default User',
  email: 'contact@jarvis.com',
};

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    setUser(defaultLocalUser);
    setUserInfo(defaultLocalUser);
    setIsLoading(false);
  }, [])

  return { user, isLoading }
}

export const useRedirectIfNotAuth = () => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // This hook is now simplified. It doesn't redirect for local mode.
    // If you want to force login for hosting mode, you'd add logic here.
    // For example: if (!isLoading && !user) router.push('/login');
    // But for now, we allow both modes.
  }, [user, isLoading, router])

  return user
} 