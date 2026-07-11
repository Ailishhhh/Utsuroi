import { NavLink } from '@/components/NavLink';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/**
 * Placeholder sign-in screen (route "/login"). Real email/password + Google auth
 * arrives in M1.7; for now it just proves navigation works.
 */
export default function Login() {
  return (
    <PlaceholderScreen title="Welcome back" subtitle="Sign in — coming in M1.7.">
      <NavLink href="/signup" label="Create an account" />
      <NavLink href="/" label="Back to app" />
    </PlaceholderScreen>
  );
}
