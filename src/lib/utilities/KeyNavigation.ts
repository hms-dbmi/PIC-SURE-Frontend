export type NavigationKeys = {
  scope: string[];
  elements: HTMLElement[];
  focusKeys: (index: number) => {
    [key: string]: HTMLElement;
  };
  charFocusKeys: string[];
  actionKeys: (index: number) => {
    [key: string]: () => void;
  };
};

export class KeyboardNavigation {
  keys: NavigationKeys;
  scopedKeys: string[];
  parentContainer: HTMLElement;

  constructor(container: HTMLElement, keys: NavigationKeys) {
    this.keys = keys;
    this.scopedKeys = [...keys.charFocusKeys, ...keys.scope];
    this.parentContainer = container;

    this.parentContainer.addEventListener('focusin', (e) => this.navFocus(e));
    this.parentContainer.addEventListener('focusout', (e) => this.navFocus(e));
    this.keys.elements.forEach((element) => {
      // Prevent focus on parent element when clicked. By default, mousedown event fires a focus event,
      // which also fires parent focus events-- click event on links are still processed as normal.
      element.addEventListener('mousedown', (e) => e.preventDefault());
    });
  }

  getElement(index: number) {
    return this.keys.elements[index];
  }

  navFocus(event: FocusEvent) {
    if (event.type === 'focusin') {
      this.parentContainer.classList.add('key-focus');
    } else if (event.type === 'focusout') {
      this.parentContainer.classList.remove('key-focus');
    }
  }

  updateNavItemFocus(element: HTMLElement) {
    element.focus();
  }

  characterElement(char: string, index: number) {
    // Get indexes of elements matching char
    const keyIndexes = this.keys.charFocusKeys
      .map((navKey, i) => (navKey === char ? i : -1))
      .filter((i) => i > -1);

    if (keyIndexes.length > 1) {
      const next = (keyIndexes.findIndex((i) => i === index) + 1) % keyIndexes.length;
      return keyIndexes[next];
    } else {
      return keyIndexes[0];
    }
  }

  handleKeydown(e: KeyboardEvent, index: number) {
    if (!this.scopedKeys.includes(e.key)) {
      return;
    }

    e.preventDefault();

    if (this.keys.charFocusKeys.includes(e.key)) {
      const charElement = this.getElement(this.characterElement(e.key, index));
      this.updateNavItemFocus(charElement);
    }

    const focusKeys = this.keys.focusKeys(index);
    if (focusKeys[e.key] !== undefined) {
      this.updateNavItemFocus(focusKeys[e.key]);
    }

    const keyActions = this.keys.actionKeys(index);
    if (keyActions[e.key] !== undefined) {
      keyActions[e.key]();
    }
  }
}
