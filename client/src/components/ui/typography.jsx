import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Typography Components - Professional text styles like shadcn/Tremor
 * Based on shadcn typography guidelines
 */

export const H1 = ({ className, children, ...props }) => (
  <h1
    className={cn(
      "scroll-m-20 text-4xl font-bold tracking-tight text-text-primary",
      className
    )}
    {...props}
  >
    {children}
  </h1>
)

export const H2 = ({ className, children, ...props }) => (
  <h2
    className={cn(
      "scroll-m-20 text-3xl font-semibold tracking-tight text-text-primary",
      className
    )}
    {...props}
  >
    {children}
  </h2>
)

export const H3 = ({ className, children, ...props }) => (
  <h3
    className={cn(
      "scroll-m-20 text-2xl font-semibold tracking-tight text-text-primary",
      className
    )}
    {...props}
  >
    {children}
  </h3>
)

export const H4 = ({ className, children, ...props }) => (
  <h4
    className={cn(
      "scroll-m-20 text-xl font-semibold tracking-tight text-text-primary",
      className
    )}
    {...props}
  >
    {children}
  </h4>
)

export const P = ({ className, children, ...props }) => (
  <p
    className={cn(
      "leading-7 text-text-primary",
      className
    )}
    {...props}
  >
    {children}
  </p>
)

export const Muted = ({ className, children, ...props }) => (
  <p
    className={cn(
      "text-sm text-text-secondary",
      className
    )}
    {...props}
  >
    {children}
  </p>
)

export const Small = ({ className, children, ...props }) => (
  <small
    className={cn(
      "text-sm font-medium leading-none text-text-primary",
      className
    )}
    {...props}
  >
    {children}
  </small>
)

export const Large = ({ className, children, ...props }) => (
  <div
    className={cn(
      "text-lg font-semibold text-text-primary",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export const Lead = ({ className, children, ...props }) => (
  <p
    className={cn(
      "text-xl text-text-secondary",
      className
    )}
    {...props}
  >
    {children}
  </p>
)

export const Code = ({ className, children, ...props }) => (
  <code
    className={cn(
      "relative rounded bg-surface px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-text-primary border border-border",
      className
    )}
    {...props}
  >
    {children}
  </code>
)

export const Blockquote = ({ className, children, ...props }) => (
  <blockquote
    className={cn(
      "mt-6 border-l-2 border-primary pl-6 italic text-text-secondary",
      className
    )}
    {...props}
  >
    {children}
  </blockquote>
)
