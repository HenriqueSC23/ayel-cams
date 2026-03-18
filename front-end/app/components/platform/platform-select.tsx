import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../ui/utils';

interface PlatformSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface PlatformSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly PlatformSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  ariaLabel?: string;
}

export function PlatformSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  triggerClassName,
  contentClassName,
  itemClassName,
  ariaLabel,
}: PlatformSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          'h-12 rounded-2xl border border-[#d7e0ea] bg-[#f8fafc] px-4 pr-4 text-[15px] font-medium text-[#35506f] transition',
          'focus-visible:border-[#009fe3] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#d8eefb]',
          'data-[state=open]:border-[#009fe3] data-[state=open]:bg-white [&_svg]:opacity-100 [&_svg]:text-[#35506f]',
          triggerClassName,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn(
          'rounded-2xl border border-[#d7e0ea] bg-white p-1 shadow-[0_12px_24px_rgba(15,23,42,0.12)]',
          contentClassName,
        )}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              'rounded-xl px-3 py-2 text-[14px] font-medium text-[#35506f]',
              'focus:bg-[#eaf5fc] focus:text-[#002a52] data-[state=checked]:bg-[#eaf5fc] data-[state=checked]:text-[#0e93d8]',
              itemClassName,
            )}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
