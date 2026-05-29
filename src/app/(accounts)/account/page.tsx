'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Check, Loader2, MapPin, Plus, Trash2, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

/* ─── Schema — Australian postcode (4 digits), field names kept for API compatibility ─── */
const addressSchema = z.object({
  billing_address_type: z.enum(['home', 'office', 'other']),
  billing_customer_name: z.string().min(1, 'First name is required').trim(),
  billing_last_name: z.string().min(1, 'Last name is required').trim(),
  billing_addressLine: z.string().min(1, 'Address line is required').trim(),
  billing_city: z.string().min(1, 'City is required').trim(),
  billing_state: z.string().min(1, 'State is required').trim(),
  billing_country: z.string().min(1, 'Country is required').trim(),
  billing_pincode: z
    .string()
    .min(1, 'Postcode is required')
    .regex(/^\d{4}$/, 'Australian postcodes are 4 digits')
    .trim(),
})

const userSchema = z.object({
  billing_fullname: z.string().min(1, 'Full name is required').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  billing_phone: z.string().min(8, 'Phone number is too short').trim(),
  billing_customer_dob: z.string().optional(),
  billing_customer_gender: z.enum(['male', 'female', 'other']).optional(),
  billing_address: z.array(addressSchema).min(1, 'Add at least one delivery address'),
})

type UserFormData = z.infer<typeof userSchema>

const blankAddress = {
  billing_address_type: 'home' as const,
  billing_customer_name: '',
  billing_last_name: '',
  billing_addressLine: '',
  billing_city: '',
  billing_state: 'VIC',
  billing_country: 'Australia',
  billing_pincode: '',
}

const AccountSettings = () => {
  const { isSignedIn, userId, isLoaded } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      billing_fullname: '',
      email: '',
      billing_phone: '',
      billing_customer_dob: '',
      billing_customer_gender: 'other',
      billing_address: [blankAddress],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'billing_address' })

  const [isLoading, setIsLoading] = useState(true)
  const [userExists, setUserExists] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/account')
    }
  }, [isSignedIn, isLoaded, router])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn || !userId) {
        setIsLoading(false)
        return
      }
      try {
        const response = await axios.get(`/api/users/${userId}`)
        const userData = response.data
        if (userData) {
          setUserExists(true)
          reset({
            billing_fullname: userData.billing_fullname || '',
            email: userData.email || '',
            billing_phone: userData.billing_phone || '',
            billing_customer_dob: userData.billing_customer_dob
              ? new Date(userData.billing_customer_dob).toISOString().split('T')[0]
              : '',
            billing_customer_gender: userData.billing_customer_gender || 'other',
            billing_address:
              userData.billing_address && userData.billing_address.length > 0
                ? userData.billing_address
                : [blankAddress],
          })
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setUserExists(false)
          reset({
            billing_fullname: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            email: user?.emailAddresses[0]?.emailAddress || '',
            billing_phone: user?.phoneNumbers[0]?.phoneNumber || '',
            billing_customer_dob: '',
            billing_customer_gender: 'other',
            billing_address: [
              {
                ...blankAddress,
                billing_customer_name: user?.firstName || '',
                billing_last_name: user?.lastName || '',
              },
            ],
          })
        } else {
          console.error('Failed to fetch user data:', error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (isSignedIn && userId && user) {
      fetchUserData()
    }
  }, [isSignedIn, userId, user, reset])

  const onSubmit = async (data: UserFormData) => {
    if (!isSignedIn || !userId) {
      toast.error('You need to be signed in to update your account.')
      router.push('/sign-in?redirect_url=/account')
      return
    }
    try {
      const payload = {
        ...data,
        billing_customer_dob: data.billing_customer_dob
          ? new Date(data.billing_customer_dob).toISOString()
          : null,
      }
      if (userExists) {
        await axios.put(`/api/users/${userId}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        })
        toast.success('Your details are saved.', {
          description: 'We updated your profile in the kitchen books.',
        })
      } else {
        await axios.post(`/api/users`, payload, {
          headers: { 'Content-Type': 'application/json' },
        })
        setUserExists(true)
        toast.success('Welcome to the bakery.', {
          description: 'Your account is set up. We can&rsquo;t wait to bake for you.',
        })
      }
    } catch (error) {
      console.error('Error updating account:', error)
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || error.message)
      } else {
        toast.error('Something went wrong saving your details.')
      }
    }
  }

  const addAddress = () => {
    append({
      ...blankAddress,
      billing_address_type: 'other',
    })
  }

  const removeAddress = async (index: number) => {
    if (fields.length <= 1) return
    if (!userExists || !isSignedIn || !userId) {
      remove(index)
      return
    }
    try {
      const currentAddresses = fields.map((f) => ({
        billing_address_type: f.billing_address_type,
        billing_customer_name: f.billing_customer_name,
        billing_last_name: f.billing_last_name,
        billing_addressLine: f.billing_addressLine,
        billing_city: f.billing_city,
        billing_state: f.billing_state,
        billing_country: f.billing_country,
        billing_pincode: f.billing_pincode,
      }))
      const updated = currentAddresses.filter((_, i) => i !== index)
      const res = await axios.put(`/api/users/${userId}`, { billing_address: updated })
      if (res.status === 200) {
        remove(index)
        toast.success('Address removed')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || error.message)
      } else {
        toast.error('Could not remove the address.')
      }
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-cream px-5 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-rose-accent" strokeWidth={1.8} />
          <p className="bake-body-sm text-cocoa-soft">Pulling your details from the kitchen…</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-3xl border border-line bg-cream p-10 text-center">
        <p className="bake-body text-cocoa-soft">Sign in to manage your account.</p>
        <button
          onClick={() => router.push('/sign-in?redirect_url=/account')}
          className="bake-btn mt-6"
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {!userExists && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-rose-accent/40 bg-rose/40 p-5"
        >
          <p className="bake-caption text-rose-accent">First time here</p>
          <p className="font-bake-display mt-1 text-[17px] font-medium text-cocoa">
            Tell us a little about yourself.
          </p>
          <p className="bake-body-sm mt-1 text-cocoa-soft">
            We use this only for delivery and the occasional birthday treat.
          </p>
        </motion.div>
      )}

      {/* ─── Personal information card ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-cream/40 p-8 md:p-12">
        {/* Decorative inner blooms */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-rose-accent/10 blur-3xl"
        />

        <header className="relative flex items-center gap-4 border-b border-line/70 pb-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-ivory text-rose-accent">
            <UserRound className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <div>
            <p className="bake-eyebrow text-taupe">Personal information</p>
            <h2 className="font-bake-display mt-1 text-[24px] font-medium text-cocoa">
              Who&rsquo;s the box for?
            </h2>
          </div>
        </header>

        <div className="relative mt-8 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
          <Field label="Full name" required error={errors.billing_fullname?.message}>
            <input
              {...register('billing_fullname')}
              type="text"
              placeholder="Aanya Mehta"
              autoComplete="name"
              className="bake-input"
            />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="hello@example.com"
              autoComplete="email"
              className="bake-input"
            />
          </Field>
          <Field label="Phone number" required error={errors.billing_phone?.message}>
            <input
              {...register('billing_phone')}
              type="tel"
              placeholder="+61 4XX XXX XXX"
              autoComplete="tel"
              className="bake-input"
            />
          </Field>
          <Field
            label="Date of birth"
            hint="Optional — we'll remember it for a birthday surprise."
            error={errors.billing_customer_dob?.message}
          >
            <input
              {...register('billing_customer_dob')}
              type="date"
              autoComplete="bday"
              className="bake-input bake-input-date"
            />
          </Field>
        </div>
      </section>

      {/* ─── Addresses ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-cream/40 p-8 md:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cocoa/5 blur-3xl"
        />

        <header className="relative flex flex-wrap items-center justify-between gap-4 border-b border-line/70 pb-6">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-ivory text-rose-accent">
              <MapPin className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <div>
              <p className="bake-eyebrow text-taupe">Delivery addresses</p>
              <h2 className="font-bake-display mt-1 text-[24px] font-medium text-cocoa">
                Where should the box go?
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={addAddress}
            className="bake-btn bake-btn-ghost bake-btn-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
            Add another address
          </button>
        </header>

        <div className="mt-8 space-y-6">
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl border border-line bg-ivory p-6 md:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bake-display flex h-8 w-8 items-center justify-center rounded-full bg-cocoa text-[13px] font-medium text-ivory">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="font-bake-display text-[16px] font-medium text-cocoa">
                    Address {index + 1}
                  </p>
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    aria-label="Remove address"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-rose-accent"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                  </button>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  label="Address type"
                  error={errors.billing_address?.[index]?.billing_address_type?.message}
                >
                  <select
                    {...register(`billing_address.${index}.billing_address_type`)}
                    className="bake-input cursor-pointer appearance-none"
                  >
                    <option value="home">Home</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <div className="hidden md:block" />
                <Field
                  label="Recipient first name"
                  required
                  error={errors.billing_address?.[index]?.billing_customer_name?.message}
                >
                  <input
                    {...register(`billing_address.${index}.billing_customer_name`)}
                    type="text"
                    placeholder="Aanya"
                    className="bake-input"
                  />
                </Field>
                <Field
                  label="Recipient last name"
                  required
                  error={errors.billing_address?.[index]?.billing_last_name?.message}
                >
                  <input
                    {...register(`billing_address.${index}.billing_last_name`)}
                    type="text"
                    placeholder="Mehta"
                    className="bake-input"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field
                    label="Address line"
                    required
                    error={errors.billing_address?.[index]?.billing_addressLine?.message}
                  >
                    <input
                      {...register(`billing_address.${index}.billing_addressLine`)}
                      type="text"
                      placeholder="352 Princes Hwy, Unit 4"
                      className="bake-input"
                    />
                  </Field>
                </div>
                <Field
                  label="City"
                  required
                  error={errors.billing_address?.[index]?.billing_city?.message}
                >
                  <input
                    {...register(`billing_address.${index}.billing_city`)}
                    type="text"
                    placeholder="Narre Warren"
                    className="bake-input"
                  />
                </Field>
                <Field
                  label="State"
                  required
                  error={errors.billing_address?.[index]?.billing_state?.message}
                >
                  <select
                    {...register(`billing_address.${index}.billing_state`)}
                    className="bake-input cursor-pointer appearance-none"
                  >
                    <option value="VIC">VIC — Victoria</option>
                    <option value="NSW">NSW — New South Wales</option>
                    <option value="QLD">QLD — Queensland</option>
                    <option value="SA">SA — South Australia</option>
                    <option value="WA">WA — Western Australia</option>
                    <option value="TAS">TAS — Tasmania</option>
                    <option value="ACT">ACT — Australian Capital Territory</option>
                    <option value="NT">NT — Northern Territory</option>
                  </select>
                </Field>
                <Field
                  label="Country"
                  required
                  error={errors.billing_address?.[index]?.billing_country?.message}
                >
                  <input
                    {...register(`billing_address.${index}.billing_country`)}
                    type="text"
                    placeholder="Australia"
                    className="bake-input"
                  />
                </Field>
                <Field
                  label="Postcode"
                  required
                  hint="4 digits"
                  error={errors.billing_address?.[index]?.billing_pincode?.message}
                >
                  <input
                    {...register(`billing_address.${index}.billing_pincode`)}
                    type="text"
                    inputMode="numeric"
                    placeholder="3805"
                    maxLength={4}
                    className="bake-input"
                  />
                </Field>
              </div>
            </motion.div>
          ))}
          {typeof errors.billing_address?.message === 'string' && (
            <p className="bake-caption text-rose-accent">{errors.billing_address.message}</p>
          )}
        </div>
      </section>

      {/* ─── Save ─── */}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <p className="bake-caption text-taupe sm:mr-2">
          We never share your details with anyone outside the bakery.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bake-btn disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.8} />
              {userExists ? 'Saving…' : 'Creating…'}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" strokeWidth={1.8} />
              {userExists ? 'Save changes' : 'Create account'}
            </>
          )}
        </button>
      </div>

      {/* Refined input styles — elegant typography, soft focus halo */}
      <style jsx global>{`
        .bake-input {
          font-family: var(--font-bake-body);
          font-size: 15px;
          line-height: 1.4;
          color: var(--color-cocoa);
          background-color: #fff;
          border: 1px solid var(--color-line);
          border-radius: 14px;
          padding: 14px 18px;
          width: 100%;
          transition: border-color 220ms ease, box-shadow 220ms ease,
            transform 220ms ease;
        }
        .bake-input::placeholder {
          color: var(--color-taupe);
          font-style: italic;
          opacity: 0.8;
        }
        .bake-input:hover {
          border-color: rgba(46, 31, 21, 0.18);
        }
        .bake-input:focus {
          outline: none;
          border-color: var(--color-rose-accent);
          box-shadow: 0 0 0 5px rgba(217, 113, 133, 0.13);
        }
        select.bake-input {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239a8472' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
          background-repeat: no-repeat;
          background-position: right 18px center;
          padding-right: 44px;
        }
        .bake-input-date::-webkit-calendar-picker-indicator {
          opacity: 0.55;
          cursor: pointer;
          filter: invert(22%) sepia(13%) saturate(880%) hue-rotate(346deg) brightness(94%) contrast(86%);
        }
      `}</style>
    </form>
  )
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-bake-body flex items-baseline justify-between">
        <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-cocoa-soft">
          {label}
          {required && (
            <span aria-hidden className="ml-1.5 text-rose-accent">
              •
            </span>
          )}
        </span>
      </span>
      <div className="mt-2.5">{children}</div>
      {error ? (
        <p className="font-bake-body mt-2 text-[12px] italic text-rose-accent">{error}</p>
      ) : hint ? (
        <p className="font-bake-body mt-2 text-[12px] italic text-taupe">{hint}</p>
      ) : null}
    </label>
  )
}

export default AccountSettings
