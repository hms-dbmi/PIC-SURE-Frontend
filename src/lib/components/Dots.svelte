<script lang="ts">
  let { class: className = '' }: { class: string } = $props();
  let primaryCircle = $state('--color-primary-500');
  let secondaryCircle = $state('--color-secondary-500');
  let tertiaryCircle = $state('--color-tertiary-500');
  let successCircle = $state('--color-success-500');
  let errorCircle = $state('--color-error-500');
  let useFiveColors = $state(false);

  const dotsColorsClass: string[] = (() => {
    try {
      return (
        (JSON.parse(
          import.meta.env.VITE_DOTS_COLORS_CLASS?.toString()?.toLowerCase(),
        ) as string[]) || []
      );
    } catch (error) {
      return [];
    }
  })();

  switch (dotsColorsClass.length) {
    case 0:
      break;
    case 3:
      primaryCircle = dotsColorsClass[0];
      secondaryCircle = dotsColorsClass[1];
      tertiaryCircle = dotsColorsClass[2];
      break;
    case 5:
      primaryCircle = dotsColorsClass[0];
      secondaryCircle = dotsColorsClass[1];
      tertiaryCircle = dotsColorsClass[2];
      successCircle = dotsColorsClass[3];
      errorCircle = dotsColorsClass[4];
      useFiveColors = true;
      break;
    default:
      break;
  }
</script>

<svg
  class={className}
  width="402px"
  height="373px"
  viewBox="0 0 402 373"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
>
  <title>PIC-SURE Login Lots</title>
  <g id="PIC-SURE-lines" stroke-width="1">
    <line x1="16.5" y1="36.5" x2="46.5" y2="89.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"
    ></line>
    <line
      x1="30.75"
      y1="29.75"
      x2="79.25"
      y2="43.25"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="46.5"
      y1="99.5"
      x2="52.5"
      y2="174.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="115.5"
      y1="115.5"
      x2="55.5"
      y2="174.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="167.5"
      y1="131.5"
      x2="115.5"
      y2="111.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="157.5"
      y1="137.5"
      x2="135.5"
      y2="221.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="104.5"
      y1="115.5"
      x2="137.5"
      y2="225.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="131.5"
      y1="221.5"
      x2="62.5"
      y2="190.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="127.5"
      y1="225.5"
      x2="25.5"
      y2="261.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="62.5"
      y1="341.5"
      x2="25.5"
      y2="261.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="30.5"
      y1="261.5"
      x2="52.5"
      y2="190.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="97.5"
      y1="60.5"
      x2="107.5"
      y2="99.5"
      id="Line"
      stroke="#ED462C"
      stroke-width="0.5"
      stroke-linecap="square"
    ></line>
    <line x1="97.5" y1="60" x2="107.5" y2="99" id="Line" stroke="#C5C7CA" stroke-linecap="square"
    ></line>
    <line
      x1="147.5"
      y1="16.75"
      x2="107.5"
      y2="39.25"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="157.5"
      y1="110.5"
      x2="157.5"
      y2="21.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="277.5"
      y1="89.5"
      x2="163.5"
      y2="119.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="277.5"
      y1="89.5"
      x2="146.5"
      y2="16.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
    <line
      x1="386.5"
      y1="23.5"
      x2="167.5"
      y2="16.5"
      id="Line"
      stroke="#C5C7CA"
      stroke-linecap="square"
    ></line>
  </g>
  <g id="PIC-SURE-circles" stroke-width="1">
    <circle
      id="white-circle"
      stroke="var(--stroke-circle)"
      fill="var({tertiaryCircle})"
      cx="17"
      cy="21"
      r="15.5"
    ></circle>
    <circle
      id="white-circle"
      stroke="var(--stroke-circle)"
      fill="var({tertiaryCircle})"
      cx="16"
      cy="261"
      r="15.5"
    ></circle>
    <circle
      id="white-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? primaryCircle : tertiaryCircle})"
      cx="109"
      cy="109"
      r="15.5"
    ></circle>
    <circle
      id="secondary-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? errorCircle : secondaryCircle})"
      cx="46"
      cy="94"
      r="15.5"
    ></circle>
    <circle
      id="secondary-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? primaryCircle : secondaryCircle})"
      cx="285"
      cy="95"
      r="15.5"
    ></circle>
    <circle
      id="secondary-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? errorCircle : secondaryCircle})"
      cx="141"
      cy="230"
      r="15.5"
    ></circle>
    <circle
      id="secondary-circle"
      stroke="var(--stroke-circle)"
      fill="var({secondaryCircle})"
      cx="151"
      cy="16"
      r="15.5"
    ></circle>
    <circle
      id="primary-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? successCircle : primaryCircle})"
      cx="55"
      cy="190"
      r="15.5"
    ></circle>
    <circle
      id="primary-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? tertiaryCircle : primaryCircle})"
      cx="65"
      cy="357"
      r="15.5"
    ></circle>
    <circle
      id="primary-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? tertiaryCircle : primaryCircle})"
      cx="157"
      cy="125"
      r="15.5"
    ></circle>
    <circle
      id="primary-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? successCircle : primaryCircle})"
      cx="92"
      cy="44"
      r="15.5"
    ></circle>
    <circle
      id="primary-circle"
      stroke="var(--stroke-circle)"
      fill="var({useFiveColors ? successCircle : primaryCircle})"
      cx="386"
      cy="23"
      r="15.5"
    ></circle>
  </g>
</svg>
