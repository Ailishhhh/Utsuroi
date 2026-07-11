import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { NavLink } from '@/components/NavLink';

/**
 * Placeholder home screen (route "/"). The launch target of the app in Phase 1.
 * The link into the auth group is here only so the nav shell is testable before
 * the M1.7 auth gate exists.
 */
export default function Home() {
  return (
    <PlaceholderScreen title="Utsuroi" subtitle="You're in the app. Home screen coming soon.">
      <NavLink href="/login" label="Go to the sign-in flow" />
    </PlaceholderScreen>
  );
}
