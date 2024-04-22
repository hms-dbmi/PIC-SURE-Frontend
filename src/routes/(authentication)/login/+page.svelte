<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { loginConfiguration } from '$lib/configuration'; 
  import auth0 from 'auth0-js';
  let redirectUrl = '/';
  const redirectTo = $page.url.searchParams.get('redirectTo');
  if (browser) {
    redirectUrl = `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? ':' + window.location.port : ''
    }/login/loading?redirectTo=${redirectTo ?? '/'}`;
  }
  const webAuth = new auth0.WebAuth({
    domain: 'avillachlab.auth0.com',
    clientID: loginConfiguration.clientId,
    redirectUri: redirectUrl,
    responseType: 'token',
  });
  function login() {
    webAuth.authorize({
      responseType: 'token',
      connection: 'google-oauth2',
    });
  }
</script>

<section class="flex justify-center items-center w-full h-full">
  <button id="login-button" on:click={login} class="btn variant-filled-primary">Log In</button>
</section>

<style>
</style>
