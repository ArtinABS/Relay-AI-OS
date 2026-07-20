"use client";

import {
  Button as HeroButton,
  Input as HeroInput,
  ListBox,
  Select as HeroSelect,
  TextArea as HeroTextArea,
  type ButtonProps as HeroButtonProps,
  type InputProps as HeroInputProps,
  type TextAreaProps as HeroTextAreaProps,
} from "@heroui/react";
import {
  Children,
  isValidElement,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

type ButtonProps = Omit<HeroButtonProps, "isDisabled"> &
  Omit<ComponentPropsWithRef<"button">, keyof HeroButtonProps | "disabled"> & {
    disabled?: boolean;
    isDisabled?: boolean;
  };

/**
 * HeroUI-backed compatibility primitive for the existing workspace controls.
 * Ghost is the neutral default because Relay already encodes emphasis in the
 * existing utility classes; call sites can opt into HeroUI variants directly.
 */
export function Button({
  disabled,
  isDisabled,
  variant = "ghost",
  ...props
}: ButtonProps) {
  return (
    <HeroButton
      isDisabled={isDisabled ?? disabled}
      variant={variant}
      {...props}
    />
  );
}

export function Input({ variant = "secondary", ...props }: HeroInputProps) {
  return <HeroInput variant={variant} {...props} />;
}

export function TextArea({
  variant = "secondary",
  ...props
}: HeroTextAreaProps) {
  return <HeroTextArea variant={variant} {...props} />;
}

type NativeSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "defaultValue" | "onChange" | "value"
> & {
  children: ReactNode;
  defaultValue?: string | number;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  value?: string | number;
};

type NativeOptionProps = {
  children?: ReactNode;
  disabled?: boolean;
  value?: string | number;
};

/**
 * Preserves the app's native-select call sites while rendering HeroUI's
 * accessible compound Select/ListBox implementation.
 */
export function Select({
  "aria-label": ariaLabel,
  children,
  className,
  defaultValue,
  disabled,
  name,
  onChange,
  required,
  value,
}: NativeSelectProps) {
  const options = Children.toArray(children).flatMap((child, index) => {
    if (!isValidElement<NativeOptionProps>(child)) return [];

    const optionValue = child.props.value ?? index;
    return [
      {
        disabled: child.props.disabled,
        id: String(optionValue),
        label: child.props.children,
      },
    ];
  });

  const emitChange = (
    nextValue: string | number | null | Array<string | number>,
  ) => {
    const selected = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    const next = selected == null ? "" : String(selected);
    onChange?.({
      currentTarget: { value: next },
      target: { value: next },
    } as ChangeEvent<HTMLSelectElement>);
  };

  return (
    <HeroSelect
      aria-label={ariaLabel ?? "Select an option"}
      defaultValue={defaultValue == null ? undefined : String(defaultValue)}
      disabledKeys={options
        .filter((option) => option.disabled)
        .map((option) => option.id)}
      fullWidth
      isDisabled={disabled}
      isRequired={required}
      name={name}
      onChange={emitChange}
      value={value == null ? null : String(value)}
      variant="secondary"
    >
      <HeroSelect.Trigger className={className}>
        <HeroSelect.Value />
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      <HeroSelect.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              id={option.id}
              key={option.id}
              textValue={String(option.label)}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </HeroSelect.Popover>
    </HeroSelect>
  );
}
