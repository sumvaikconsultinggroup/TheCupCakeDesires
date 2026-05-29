'use client'

import ButtonThird from '@/shared/Button/ButtonThird'
import { Field, FieldGroup, Fieldset, Label } from '@/shared/fieldset'
import { Input } from '@/shared/input'
import { Radio, RadioField, RadioGroup } from '@/shared/radio'
import { useUser } from '@clerk/nextjs'
import { CreditCardPosIcon, Route02Icon, UserCircle02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import axios from 'axios'
import clsx from 'clsx'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

type Tab = 'ContactInfo' | 'ShippingAddress' | 'PaymentMethod' | null

type IconSvgElement = React.ComponentProps<typeof HugeiconsIcon>['icon']

interface InformationProps {
  onUpdateUserInfo: (info: {
    name: string
    lastName: string
    phone: string
    address: string
    email: string
    city: string
    state: string
    country: string
    zipcode: string
    gender?: string
    dob?: string
    addressType?: string
    id?: string
  }) => void
  onUpdatePaymentMethod: (method: string) => void
  onUpdateValidation: (isValid: boolean) => void
  createAccount?: boolean
  onCreateAccountChange?: (create: boolean) => void
  onPasswordChange?: (password: string) => void
}

export interface AddressDTO {
  billing_address_type: 'home' | 'office' | 'other'
  billing_customer_name: string
  billing_last_name: string
  billing_addressLine: string
  billing_city: string
  billing_state: string
  billing_country: string
  billing_pincode: string
}

export interface UserDTO {
  id: string
  clerkId: string
  billing_fullname: string
  email: string
  billing_phone: string
  billing_customer_gender: 'male' | 'female' | 'other'
  billing_customer_dob: string
  billing_address: AddressDTO[]
  wallet: { points: number }
  createdAt?: string
  updatedAt?: string
}

const Spinner = () => (
  <svg className="mr-2 -ml-1 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

const Information: React.FC<InformationProps> = ({
  onUpdateUserInfo,
  onUpdatePaymentMethod,
  onUpdateValidation,
  createAccount = false,
  onCreateAccountChange,
  onPasswordChange,
}) => {
  const [tabActive, setTabActive] = useState<Tab>('ContactInfo')
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserDTO | null>(null)
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0)
  const { user: clerkUser } = useUser()
  const [isContactInfoComplete, setIsContactInfoComplete] = useState(false)
  const [isShippingAddressComplete, setIsShippingAddressComplete] = useState(false)

  useEffect(() => {
    onUpdateValidation(isContactInfoComplete && isShippingAddressComplete)
  }, [isContactInfoComplete, isShippingAddressComplete, onUpdateValidation])

  useEffect(() => {
    if (userData) {
      const selectedAddress = userData.billing_address?.[selectedAddressIndex]

      onUpdateUserInfo({
        name: userData.billing_fullname || '',
        lastName: selectedAddress?.billing_last_name || '',
        phone: userData.billing_phone || '',
        email: userData.email || '',
        address: selectedAddress
          ? `${selectedAddress.billing_addressLine}, ${selectedAddress.billing_city}, ${selectedAddress.billing_state}`
          : '',
        city: selectedAddress?.billing_city || '',
        state: selectedAddress?.billing_state || '',
        country: selectedAddress?.billing_country || '',
        zipcode: selectedAddress?.billing_pincode || '',
        gender: userData.billing_customer_gender || '',
        dob: userData.billing_customer_dob || '',
        addressType: selectedAddress?.billing_address_type || '',
        id: userData.id || '',
      })
      setIsShippingAddressComplete(!!selectedAddress)
    }
  }, [userData, selectedAddressIndex, onUpdateUserInfo])

  useEffect(() => {
    const fetchUserData = async () => {
      // If no Clerk user, allow guest checkout
      if (!clerkUser) {
        setIsLoading(false)
        setUserData(null) // Guest user, no data yet
        return
      }
      try {
        const response = await axios.get(`/api/users/${clerkUser.id}`)
        const user = response.data
        setUserData(response.data)
        if (user) {
          setIsContactInfoComplete(!!(user.billing_fullname && user.email && user.billing_phone))
          setIsShippingAddressComplete(!!(user.billing_address && user.billing_address.length > 0))
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        // Allow continuing even if fetch fails (guest checkout)
        setUserData(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserData()
  }, [clerkUser])

  const handleUpdateUser = async (data: any) => {
    // If data includes a new clerkId (from account creation), update userData
    if (data.clerkId && !userData?.clerkId) {
      setUserData((prev) => ({
        ...(prev || {
          id: data.id || 'guest',
          clerkId: '',
          billing_fullname: '',
          email: '',
          billing_phone: '',
          billing_customer_gender: 'other',
          billing_customer_dob: '',
          billing_address: [],
          wallet: { points: 0 },
        }),
        ...data,
      }))
      return
    }

    // For guest users (no clerkId), update local state only
    if (!userData?.clerkId && !data.clerkId) {
      setUserData((prev) => ({
        ...(prev || {
          id: 'guest',
          clerkId: '',
          billing_fullname: '',
          email: '',
          billing_phone: '',
          billing_customer_gender: 'other',
          billing_customer_dob: '',
          billing_address: [],
          wallet: { points: 0 },
        }),
        ...data,
      }))
      return
    }

    try {
      // Merge new data with existing user data to prevent overwrites on the backend
      const updatedUserData = { ...userData, ...data }
      const targetClerkId = data.clerkId || userData?.clerkId

      if (!targetClerkId) {
        console.error('No clerkId available for update')
        throw new Error('No clerkId available')
      }

      const response = await axios.put(`/api/users/${targetClerkId}`, updatedUserData)
      setUserData(response.data.user)
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  const handleScrollToEl = (id: string) => {
    const element = document.getElementById(id)
    setTimeout(() => {
      element?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  if (isLoading) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="size-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-[#1b198f] dark:border-neutral-700 dark:border-t-[#6b69d6]" />
        </div>
        <p className="text-sm font-medium text-neutral-400 dark:text-neutral-500">Loading checkout...</p>
      </div>
    )
  }

  // Allow continuation for guest users (userData will be null)
  const selectedAddress = userData?.billing_address?.[selectedAddressIndex]

  return (
    <div className="space-y-5 font-sans">
      {/* Step 1: Contact */}
      <div
        id="ContactInfo"
        className="scroll-mt-5 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_1px_20px_rgba(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-[0_2px_28px_rgba(0,0,0,0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
      >
        <TabHeader
          title="Contact information"
          icon={UserCircle02Icon}
          step={1}
          value={[userData?.billing_fullname, userData?.email, userData?.billing_phone].filter(Boolean).join(' \u00B7 ')}
          isCompleted={isContactInfoComplete}
          onClickChange={() => {
            setTabActive('ContactInfo')
            handleScrollToEl('ContactInfo')
          }}
        />
        <div className={clsx('border-t border-neutral-100 p-6 lg:p-8 dark:border-neutral-800', tabActive !== 'ContactInfo' && 'invisible hidden')}>
          <ContactInfo
            currentUser={userData || undefined}
            onUpdate={handleUpdateUser}
            onClose={() => {
              setTabActive(null)
            }}
            onValidationChange={setIsContactInfoComplete}
            createAccount={createAccount}
            onCreateAccountChange={onCreateAccountChange}
            onPasswordChange={onPasswordChange}
          />
        </div>
      </div>

      {/* Step 2: Shipping */}
      <div
        id="ShippingAddress"
        className="scroll-mt-5 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_1px_20px_rgba(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-[0_2px_28px_rgba(0,0,0,0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
      >
        <TabHeader
          title="Shipping address"
          icon={Route02Icon}
          step={2}
          value={
            selectedAddress
              ? `${selectedAddress.billing_addressLine}, ${selectedAddress.billing_city}, ${selectedAddress.billing_state}`
              : 'No address selected'
          }
          isCompleted={!!selectedAddress}
          disabled={!isContactInfoComplete}
          onClickChange={() => {
            if (!isContactInfoComplete) return
            setTabActive('ShippingAddress')
            handleScrollToEl('ShippingAddress')
          }}
        />
        <div className={clsx('border-t border-neutral-100 p-6 lg:p-8 dark:border-neutral-800', tabActive !== 'ShippingAddress' && 'invisible hidden')}>
          <ShippingAddress
            currentUser={userData || undefined}
            onUpdate={handleUpdateUser}
            selectedAddressIndex={selectedAddressIndex}
            setSelectedAddressIndex={setSelectedAddressIndex}
            onClose={() => {
              setTabActive(null)
            }}
          />
        </div>
      </div>

      {/* Step 3: Payment */}
      <div
        id="PaymentMethod"
        className="scroll-mt-5 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_1px_20px_rgba(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-[0_2px_28px_rgba(0,0,0,0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
      >
        <TabHeader
          title="Payment method"
          icon={CreditCardPosIcon}
          step={3}
          value="Prepaid"
          isCompleted={true}
          disabled={!isContactInfoComplete || !isShippingAddressComplete}
          onClickChange={() => {
            if (!isContactInfoComplete || !isShippingAddressComplete) return
            setTabActive('PaymentMethod')
            handleScrollToEl('PaymentMethod')
          }}
        />
        <div className={clsx('border-t border-neutral-100 p-6 lg:p-8 dark:border-neutral-800', tabActive !== 'PaymentMethod' && 'invisible hidden')}>
          <PaymentMethod
            onClose={() => {
              setTabActive('ShippingAddress')
              handleScrollToEl('ShippingAddress')
            }}
            onUpdatePaymentMethod={onUpdatePaymentMethod}
          />
        </div>
      </div>
    </div>
  )
}

const TabHeader = ({
  title,
  icon,
  step,
  value,
  onClickChange,
  isCompleted,
  disabled,
}: {
  title: string
  icon: IconSvgElement
  step?: number
  value: string
  onClickChange: () => void
  isCompleted?: boolean
  disabled?: boolean
}) => {
  return (
    <div className="bg-neutral-50/60 px-6 py-4 lg:px-8 dark:bg-neutral-800/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          {/* Step number / completion indicator */}
          <div
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300',
              isCompleted
                ? 'bg-emerald-500 dark:bg-emerald-600'
                : disabled
                  ? 'bg-neutral-200 dark:bg-neutral-700'
                  : 'bg-[#1b198f] dark:bg-[#2d2bb8]'
            )}
          >
            {isCompleted ? (
              <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <span className={clsx(
                'text-sm font-bold',
                disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-white'
              )}>
                {step}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className={clsx(
              'text-[15px] font-semibold',
              disabled ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
            )}>
              {title}
            </h3>
            {value && (
              <p className="mt-0.5 max-w-sm truncate text-[13px] text-neutral-500 dark:text-neutral-400">
                {value}
              </p>
            )}
          </div>
        </div>
        <button
          className={clsx(
            'self-start text-[13px] font-semibold tracking-wide transition-colors duration-200',
            disabled
              ? 'cursor-not-allowed text-neutral-300 dark:text-neutral-600'
              : 'text-[#1b198f] hover:text-[#14126e] dark:text-[#6b69d6] dark:hover:text-[#8b89e6]'
          )}
          onClick={onClickChange}
          type="button"
          disabled={disabled}
        >
          Edit
        </button>
      </div>
    </div>
  )
}

const ContactInfo = ({
  onClose,
  currentUser,
  onUpdate,
  onValidationChange,
  createAccount = false,
  onCreateAccountChange,
  onPasswordChange,
}: {
  onClose: () => void
  currentUser: UserDTO | undefined
  onUpdate: (data: Partial<UserDTO>) => Promise<void>
  onValidationChange: (isValid: boolean) => void
  createAccount?: boolean
  onCreateAccountChange?: (create: boolean) => void
  onPasswordChange?: (password: string) => void
}) => {
  const { isSignedIn } = useUser()
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState(currentUser?.billing_fullname || '')
  const [phone, setPhone] = useState(currentUser?.billing_phone || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [password, setPassword] = useState('')
  const [fullNameError, setFullNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Validation: require password only when creating account
  useEffect(() => {
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean)
    const cleanPhone = phone.replace(/\D/g, '')
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    const nameValid = nameParts.length >= 2
    const phoneValid = cleanPhone.length === 10 || (cleanPhone.length === 12 && cleanPhone.startsWith('91'))
    const emailValid = emailRegex.test(email.trim())
    const baseValid = nameValid && phoneValid && emailValid
    const passwordValid = !createAccount || (createAccount && !!password)
    onValidationChange(!!(baseValid && passwordValid))
  }, [fullName, phone, email, createAccount, password, onValidationChange])

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value)
    if (fullNameError && e.target.value) {
      setFullNameError('')
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value)
    if (phoneError && e.target.value) {
      setPhoneError('')
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError && e.target.value) {
      setEmailError('')
    }
  }

  const validateFullName = () => {
    if (!fullName.trim()) {
      setFullNameError('Full name is required.')
      return false
    }
    if (fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
      setFullNameError('Please enter both first and last name.')
      return false
    }
    setFullNameError('')
    return true
  }

  const validatePhone = () => {
    if (!phone) {
      setPhoneError('Phone number is required.')
      return false
    }
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '')

    // Accept either 10 digits or 12 digits (with country code 91)
    if (cleanPhone.length === 10) {
      setPhoneError('')
      return true
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      setPhoneError('')
      return true
    } else {
      setPhoneError('Please enter a valid 10-digit Australian mobile number.')
      return false
    }
  }

  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required.')
      return false
    }
    // More comprehensive email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.')
      return false
    }
    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
    const domain = email.split('@')[1]?.toLowerCase()
    if (domain && (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.'))) {
      setEmailError('Please check your email address for typos.')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePassword = () => {
    // Only validate password when user wants to create account
    if (isSignedIn || !createAccount) {
      setPasswordError('')
      return true
    }

    if (!password) {
      setPasswordError('Password is required to create your account.')
      return false
    }

    // Password must be at least 8 characters
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.')
      return false
    }

    // Password must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter.')
      return false
    }

    // Password must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter.')
      return false
    }

    // Password must contain at least one number
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number.')
      return false
    }

    // Password must contain at least one special character
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      setPasswordError('Password must contain at least one special character (!@#$%^&*...).')
      return false
    }

    setPasswordError('')
    return true
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (passwordError && e.target.value) {
      setPasswordError('')
    }
    onPasswordChange?.(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isFullNameValid = validateFullName()
    const isPhoneValid = validatePhone()
    const isEmailValid = validateEmail()
    const isPasswordValid = validatePassword()

    if (!isFullNameValid || !isPhoneValid || !isEmailValid || !isPasswordValid) {
      return
    }

    setIsLoading(true)
    try {
      // If user is not signed in AND wants to create account, create a Clerk account
      if (!isSignedIn && createAccount && password) {
        // Check if email already exists in database
        const emailCheckResponse = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`)
        const emailCheckData = await emailCheckResponse.json()

        if (emailCheckData.exists) {
          setEmailError('An account with this email already exists. Please log in instead.')
          setIsLoading(false)
          return
        }

        // Create Clerk account
        const accountResponse = await fetch('/api/auth/create-guest-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: fullName,
            phone,
            createAccount: true,
          }),
        })

        const accountData = await accountResponse.json()

        if (!accountData.success) {
          setEmailError(accountData.message || 'Failed to create account. Please try again.')
          setIsLoading(false)
          return
        }

        // Update parent component with new user data including clerkId
        // This allows subsequent operations to save to MongoDB
        await onUpdate({
          id: accountData.mongoUserId,
          clerkId: accountData.userId,
          billing_fullname: fullName,
          billing_phone: phone,
          email: email,
        })
      } else {
        // For existing users or users not creating account
        await onUpdate({
          billing_fullname: fullName,
          billing_phone: phone,
          email: email,
        })
      }
      onClose()
    } catch (error) {
      console.error(error)
      setEmailError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action="#" method="POST" onSubmit={handleSubmit}>
      <Fieldset>
        <FieldGroup className="mt-0!">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Contact information</h3>
            {!isSignedIn && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Already have an account?{' '}
                  <Link className="font-medium text-primary-600 hover:underline" href="/sign-in?redirect_url=/checkout">
                    Log in
                  </Link>
                </p>
              </div>
            )}
          </div>
          <Field className="max-w-lg">
            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="text-red-500">*</span> Full name
            </Label>
            <Input
              value={fullName}
              onChange={handleFullNameChange}
              onBlur={validateFullName}
              type="text"
              name="fullname"
              required
              placeholder="John Doe"
              className={clsx(
                'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                fullNameError ? 'border-red-500' : ''
              )}
            />
            {fullNameError && <p className="mt-1.5 text-sm font-medium text-red-600">{fullNameError}</p>}
          </Field>
          <Field className="max-w-lg">
            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="text-red-500">*</span> Your phone number
            </Label>
            <Input
              value={phone}
              onChange={handlePhoneChange}
              onBlur={validatePhone}
              type="tel"
              name="phone"
              required
              className={clsx(
                'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                phoneError ? 'border-red-500' : ''
              )}
            />
            {phoneError && <p className="mt-1.5 text-sm font-medium text-red-600">{phoneError}</p>}
          </Field>
          <Field className="max-w-lg">
            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="text-red-500">*</span> Email address
            </Label>
            <Input
              value={email}
              onChange={handleEmailChange}
              onBlur={validateEmail}
              type="email"
              name="email"
              required
              className={clsx(
                'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                emailError ? 'border-red-500' : ''
              )}
            />
            {emailError && <p className="mt-1.5 text-sm font-medium text-red-600">{emailError}</p>}
          </Field>

          {!isSignedIn && (
            <>
              <Field className="mt-4 max-w-lg">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="create-account"
                    checked={createAccount}
                    onChange={(e) => {
                      const checked = e.target.checked
                      onCreateAccountChange?.(checked)
                      if (!checked) {
                        setPassword('')
                        onPasswordChange?.('')
                        setPasswordError('')
                      }
                    }}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Label htmlFor="create-account" className="cursor-pointer text-sm text-neutral-700 dark:text-neutral-300">
                    Create an account with this email for easier checkout next time
                  </Label>
                </div>
              </Field>
              {createAccount && (
                <Field className="mt-4 max-w-lg">
                  <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    <span className="text-red-500">*</span> Choose a password
                  </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password for your account"
                  minLength={8}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={validatePassword}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 pr-10 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                    passwordError ? 'border-red-500' : ''
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.477 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="mt-1.5 text-sm font-medium text-red-600">{passwordError}</p>}
              {!passwordError && (
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Password must be at least 8 characters and include uppercase, lowercase, number, and special
                  character.
                </p>
              )}
                </Field>
              )}
            </>
          )}

          <Field>
            <Label className="text-sm text-neutral-600 dark:text-neutral-400">
              We'll use this information to contact you about your order.
            </Label>
          </Field>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2.5 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-[#1b198f] px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#14126e] hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-[#2d2bb8] dark:hover:bg-[#1b198f]"
            >
              {isLoading ? <Spinner /> : null}
              {isLoading ? 'Updating...' : 'Continue to Shipping'}
            </button>
            <ButtonThird type="button" onClick={onClose}>
              Cancel
            </ButtonThird>
          </div>
        </FieldGroup>
      </Fieldset>
    </form>
  )
}

const ShippingAddress = ({
  currentUser,
  onUpdate,
  selectedAddressIndex,
  setSelectedAddressIndex,
  onClose,
}: {
  currentUser: UserDTO | undefined
  onUpdate: (data: Partial<UserDTO>) => Promise<void>
  selectedAddressIndex: number
  setSelectedAddressIndex: (index: number) => void
  onClose: () => void
}) => {
  const [isAddingNew, setIsAddingNew] = useState(!currentUser?.billing_address?.length)
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null)
  const [tempSelectedIndex, setTempSelectedIndex] = useState(selectedAddressIndex)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (data: any) => {
    const newErrors: Record<string, string> = {}
    if (!data.billing_customer_name?.trim()) newErrors.firstName = 'First name is required'
    if (!data.billing_last_name?.trim()) newErrors.lastName = 'Last name is required'
    if (!data.billing_addressLine?.trim()) newErrors.address = 'Address is required'
    if (!data.billing_city?.trim()) newErrors.city = 'City is required'
    if (!data.billing_country?.trim()) newErrors.country = 'Country is required'
    if (!data.billing_state?.trim()) newErrors.state = 'State/Province is required'
    if (!data.billing_pincode?.trim()) {
      newErrors.zip = 'Postal code is required'
    } else if (!/^\d{4}$/.test(data.billing_pincode.trim())) {
      newErrors.zip = 'Postal code must be exactly 4 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formValues = Object.fromEntries(new FormData(e.target as HTMLFormElement))
    const addressData: AddressDTO = {
      billing_address_type: formValues['address-type'] as any,
      billing_customer_name: formValues['first-name'] as string,
      billing_last_name: formValues['last-name'] as string,
      billing_addressLine: formValues['address'] as string,
      billing_city: formValues['city'] as string,
      billing_state: formValues['state-province'] as string,
      billing_country: formValues['country'] as string,
      billing_pincode: formValues['postal-code'] as string,
    }

    if (!validate(addressData)) return

    setIsLoading(true)
    try {
      if (isAddingNew) {
        // Create new billing_address array with the new address appended
        const updatedAddresses = [...(currentUser?.billing_address || []), addressData]
        await onUpdate({ billing_address: updatedAddresses })

        // Update local state
        const newLength = updatedAddresses.length
        setTempSelectedIndex(newLength - 1)
        setSelectedAddressIndex(newLength - 1)
        setIsAddingNew(false)
      } else if (editingAddressIndex !== null) {
        const updatedAddresses = [...(currentUser?.billing_address || [])]
        updatedAddresses[editingAddressIndex] = addressData
        await onUpdate({ billing_address: updatedAddresses })
        setEditingAddressIndex(null)
      }
    } catch (error: any) {
      console.error('Failed to save shipping address:', error)
      const errorMessage =
        error?.response?.data?.error || error?.message || 'Failed to save shipping address. Please try again.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Only update if selection has changed
    if (tempSelectedIndex !== selectedAddressIndex) {
      setSelectedAddressIndex(tempSelectedIndex)
    }
    onClose()
  }

  const addressToEdit = editingAddressIndex !== null ? currentUser?.billing_address?.[editingAddressIndex] : null
  const showForm = isAddingNew || editingAddressIndex !== null

  // Form for adding or editing an address
  if (showForm) {
    const existingTypes = currentUser?.billing_address?.map((a) => a.billing_address_type) || []
    const isHomeDisabled =
      existingTypes.includes('home') && (isAddingNew || addressToEdit?.billing_address_type !== 'home')
    const isOfficeDisabled =
      existingTypes.includes('office') && (isAddingNew || addressToEdit?.billing_address_type !== 'office')
    const defaultType = addressToEdit?.billing_address_type || (isHomeDisabled ? 'office' : 'home')

    return (
      <form onSubmit={handleSaveAddress}>
        <Fieldset>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {isAddingNew ? 'Add a new address' : 'Edit address'}
          </h3>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> Recipient first name
                </Label>
                <Input
                  placeholder="John"
                  type="text"
                  name="first-name"
                  defaultValue={addressToEdit?.billing_customer_name}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.firstName ? 'border-red-500' : ''
                  )}
                  onChange={() => setErrors((prev) => ({ ...prev, firstName: '' }))}
                />
                {errors.firstName && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.firstName}</p>}
              </Field>
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> Recipient last name
                </Label>
                <Input
                  placeholder="Doe"
                  type="text"
                  name="last-name"
                  defaultValue={addressToEdit?.billing_last_name}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.lastName ? 'border-red-500' : ''
                  )}
                  onChange={() => setErrors((prev) => ({ ...prev, lastName: '' }))}
                />
                {errors.lastName && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.lastName}</p>}
              </Field>
            </div>
            <Field>
              <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <span className="text-red-500">*</span> Address
              </Label>
              <Input
                placeholder="123 Dream Avenue"
                type="text"
                name="address"
                defaultValue={addressToEdit?.billing_addressLine}
                className={clsx(
                  'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                  errors.address ? 'border-red-500' : ''
                )}
                onChange={() => setErrors((prev) => ({ ...prev, address: '' }))}
              />
              {errors.address && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.address}</p>}
            </Field>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> City
                </Label>
                <Input
                  placeholder="Melbourne"
                  type="text"
                  name="city"
                  defaultValue={addressToEdit?.billing_city}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.city ? 'border-red-500' : ''
                  )}
                  onChange={() => setErrors((prev) => ({ ...prev, city: '' }))}
                />
                {errors.city && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.city}</p>}
              </Field>
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> Country
                </Label>
                <Input
                  placeholder="Australia"
                  type="text"
                  name="country"
                  defaultValue={addressToEdit?.billing_country}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.country ? 'border-red-500' : ''
                  )}
                  onChange={() => setErrors((prev) => ({ ...prev, country: '' }))}
                />
                {errors.country && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.country}</p>}
              </Field>
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> State / Province
                </Label>
                <Input
                  placeholder="Victoria"
                  type="text"
                  name="state-province"
                  defaultValue={addressToEdit?.billing_state}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.state ? 'border-red-500' : ''
                  )}
                  onChange={() => setErrors((prev) => ({ ...prev, state: '' }))}
                />
                {errors.state && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.state}</p>}
              </Field>
              <Field>
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="text-red-500">*</span> Postal code
                </Label>
                <Input
                  placeholder="3805"
                  type="text"
                  name="postal-code"
                  defaultValue={addressToEdit?.billing_pincode}
                  maxLength={4}
                  className={clsx(
                    'rounded-md border-neutral-200 px-4 py-2.5 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700',
                    errors.zip ? 'border-red-500' : ''
                  )}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    e.target.value = value
                    setErrors((prev) => ({ ...prev, zip: '' }))
                  }}
                />
                {errors.zip && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.zip}</p>}
              </Field>
            </div>
            <Field>
              <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Address Type</Label>
              <RadioGroup name="address-type" defaultValue={defaultType}>
                <RadioField>
                  <Radio value="home" disabled={isHomeDisabled} />
                  <Label>Home</Label>
                </RadioField>
                <RadioField>
                  <Radio value="office" disabled={isOfficeDisabled} />
                  <Label>Office</Label>
                </RadioField>
                <RadioField>
                  <Radio value="other" />
                  <Label>Other</Label>
                </RadioField>
              </RadioGroup>
            </Field>
            <div className="flex flex-wrap gap-2.5 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-[#1b198f] px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#14126e] hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-[#2d2bb8] dark:hover:bg-[#1b198f]"
              >
                {isLoading ? <Spinner /> : null}
                {isLoading ? 'Saving...' : 'Save Address'}
              </button>
              <ButtonThird
                type="button"
                onClick={() => {
                  setIsAddingNew(false)
                  setEditingAddressIndex(null)
                  setErrors({})
                }}
              >
                Cancel
              </ButtonThird>
            </div>
          </FieldGroup>
        </Fieldset>
      </form>
    )
  }

  // View for selecting an existing address
  return (
    <div className="space-y-6">
      <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-white">
        Choose a shipping address
      </h3>
      <RadioGroup
        value={String(tempSelectedIndex)}
        onChange={(val) => {
          setTempSelectedIndex(Number(val))
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {currentUser?.billing_address?.map((address, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_12px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-neutral-300 hover:shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:border-neutral-700 dark:bg-neutral-800/60 dark:hover:border-neutral-600"
            >
              <RadioField>
                <Radio value={String(index)} />
                <Label className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-md bg-[#1b198f]/8 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#1b198f] uppercase dark:bg-[#6b69d6]/15 dark:text-[#8b89e6]">
                      {address.billing_address_type}
                    </span>
                  </div>
                  {(address.billing_customer_name || address.billing_last_name) && (
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {address.billing_customer_name} {address.billing_last_name}
                    </p>
                  )}
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {address.billing_addressLine}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {address.billing_city}, {address.billing_state} {address.billing_pincode}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{address.billing_country}</p>
                </Label>
              </RadioField>
              <button
                type="button"
                onClick={() => {
                  setEditingAddressIndex(index)
                  setErrors({})
                }}
                className="absolute top-3 right-3 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase transition-all hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-200"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </RadioGroup>

      <ButtonThird
        type="button"
        onClick={() => {
          setIsAddingNew(true)
          setErrors({})
        }}
      >
        + Add a new address
      </ButtonThird>

      <div className="flex flex-wrap gap-2.5 pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-xl bg-[#1b198f] px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#14126e] hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-[#2d2bb8] dark:hover:bg-[#1b198f]"
        >
          Continue
        </button>
        <ButtonThird type="button" onClick={onClose}>
          Cancel
        </ButtonThird>
      </div>
    </div>
  )
}

const PaymentMethod = ({
  onClose,
  onUpdatePaymentMethod,
}: {
  onClose: () => void
  onUpdatePaymentMethod: (method: string) => void
}) => {
  useEffect(() => {
    // Only prepaid is available — set it automatically on mount
    onUpdatePaymentMethod('prepaid')
  }, [onUpdatePaymentMethod])

  return (
    <div>
      <div className="rounded-xl border-2 border-[#1b198f] bg-[#1b198f]/3 p-5 shadow-[0_0_0_1px_rgba(27,25,143,0.1)] dark:border-[#6b69d6] dark:bg-[#6b69d6]/5">
        <div className="flex items-center gap-4">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1b198f] dark:border-[#6b69d6]">
            <div className="h-2.5 w-2.5 rounded-full bg-[#1b198f] dark:bg-[#6b69d6]" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1b198f]/10 dark:bg-[#6b69d6]/15">
                <svg
                  className="h-4.5 w-4.5 text-[#1b198f] dark:text-[#6b69d6]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Online Payment</span>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Cards, EFTPOS, PayPal</p>
              </div>
            </div>
          </div>

          <span className="rounded-md bg-[#1b198f]/10 px-2 py-0.5 text-[10px] font-bold text-[#1b198f] dark:bg-[#6b69d6]/15 dark:text-[#8b89e6]">
            Selected
          </span>
        </div>

        <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-[13px] leading-relaxed text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
          You&apos;ll be redirected to a secure payment gateway to complete your payment.
        </div>
      </div>
    </div>
  )
}

export default Information
