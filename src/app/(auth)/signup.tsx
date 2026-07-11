import { NavLink } from '@/components/NavLink';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/**
 * Placeholder sign-up screen (route "/signup"). Real registration arrives in M1.7.
 */
export default function Signup() {
  return (
    <PlaceholderScreen title="Begin" subtitle="Create your account — coming in M1.7.">
      <NavLink href="/login" label="I already have an account" />
    </PlaceholderScreen>
  );
}
