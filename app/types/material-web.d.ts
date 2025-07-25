// Material Web Components TypeScript declarations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace JSX {
  interface IntrinsicElements {
    // Buttons
    'md-filled-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      'soft-disabled'?: boolean;
      href?: string;
      target?: string;
      'trailing-icon'?: boolean;
      'has-icon'?: boolean;
      type?: 'button' | 'reset' | 'submit';
      value?: string;
      form?: string;
    };
    'md-outlined-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      'soft-disabled'?: boolean;
      href?: string;
      target?: string;
      'trailing-icon'?: boolean;
      'has-icon'?: boolean;
      type?: 'button' | 'reset' | 'submit';
      value?: string;
      form?: string;
    };
    'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      'soft-disabled'?: boolean;
      href?: string;
      target?: string;
      'trailing-icon'?: boolean;
      'has-icon'?: boolean;
      type?: 'button' | 'reset' | 'submit';
      value?: string;
      form?: string;
    };
    'md-elevated-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      'soft-disabled'?: boolean;
      href?: string;
      target?: string;
      'trailing-icon'?: boolean;
      'has-icon'?: boolean;
      type?: 'button' | 'reset' | 'submit';
      value?: string;
      form?: string;
    };
    'md-filled-tonal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      'soft-disabled'?: boolean;
      href?: string;
      target?: string;
      'trailing-icon'?: boolean;
      'has-icon'?: boolean;
      type?: 'button' | 'reset' | 'submit';
      value?: string;
      form?: string;
    };

    // Text Fields
    'md-outlined-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      readonly?: boolean;
      required?: boolean;
      'error-text'?: string;
      'supporting-text'?: string;
      'max-length'?: number;
      'min-length'?: number;
      type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
      autocomplete?: string;
      pattern?: string;
      multiple?: boolean;
      name?: string;
      'prefix-text'?: string;
      'suffix-text'?: string;
      rows?: number;
    };
    'md-filled-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      readonly?: boolean;
      required?: boolean;
      'error-text'?: string;
      'supporting-text'?: string;
      'max-length'?: number;
      'min-length'?: number;
      type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
      autocomplete?: string;
      pattern?: string;
      multiple?: boolean;
      name?: string;
      'prefix-text'?: string;
      'suffix-text'?: string;
      rows?: number;
    };

    // Progress
    'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      value?: number;
      max?: number;
      indeterminate?: boolean;
      'four-color'?: boolean;
    };
    'md-linear-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      value?: number;
      max?: number;
      indeterminate?: boolean;
      'four-color'?: boolean;
      buffer?: number;
    };

    // Dialog
    'md-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      open?: boolean;
      'quick-close'?: boolean;
      'no-focus-trap'?: boolean;
      'get-open-animation'?: () => unknown;
      'get-close-animation'?: () => unknown;
    };

    // Icon
    'md-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      filled?: boolean;
      'font-size'?: number;
    };

    // Checkbox
    'md-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      checked?: boolean;
      indeterminate?: boolean;
      disabled?: boolean;
      required?: boolean;
      value?: string;
      name?: string;
    };

    // Select
    'md-outlined-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      value?: string;
      disabled?: boolean;
      required?: boolean;
      label?: string;
      'supporting-text'?: string;
      'error-text'?: string;
      'menu-positioning'?: 'absolute' | 'fixed';
      'clamp-menu-width'?: boolean;
      'type-ahead-delay'?: number;
      'has-leading-icon'?: boolean;
      'display-text'?: string;
      name?: string;
    };
    'md-select-option': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      selected?: boolean;
      value?: string;
      type?: 'option' | 'button';
      'display-text'?: string;
    };

    // Cards
    'md-elevated-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      href?: string;
      target?: string;
    };
    'md-filled-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      href?: string;
      target?: string;
    };
    'md-outlined-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      href?: string;
      target?: string;
    };

    // Icon Button
    'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      'soft-disabled'?: boolean;
      selected?: boolean;
      toggle?: boolean;
      href?: string;
      target?: string;
      'aria-label-selected'?: string;
      type?: 'button' | 'reset' | 'submit';
      value?: string;
      name?: string;
      form?: string;
    };
    'md-filled-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      'soft-disabled'?: boolean;
      selected?: boolean;
      toggle?: boolean;
      href?: string;
      target?: string;
      'aria-label-selected'?: string;
      type?: 'button' | 'reset' | 'submit';
      value?: string;
      name?: string;
      form?: string;
    };
    'md-outlined-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean;
      'soft-disabled'?: boolean;
      selected?: boolean;
      toggle?: boolean;
      href?: string;
      target?: string;
      'aria-label-selected'?: string;
      type?: 'button' | 'reset' | 'submit';
      value?: string;
      name?: string;
      form?: string;
    };

    // Divider
    'md-divider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      inset?: boolean;
      'inset-start'?: boolean;
      'inset-end'?: boolean;
    };
  }
}

// Extend the global namespace to include Material Web events
declare global {
  interface HTMLElementEventMap {
    'input': InputEvent;
    'change': Event;
    'close': Event;
    'open': Event;
    'opening': Event;
    'opened': Event;
    'closing': Event;
    'closed': Event;
  }
}

export {};