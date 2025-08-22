<script lang="ts">
  interface Props {
    value: string;
  }

  let { value }: Props = $props();
</script>

<a
  href="https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id={value}"
  target="_blank"
  rel="noopener noreferrer"
  class="btn preset-filled-primary-500"
>
  {value}
</a>
