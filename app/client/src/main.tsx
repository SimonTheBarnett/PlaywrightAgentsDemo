import { useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { api, money, RequestError, type Booking, type Room, type User } from './api.js';
import './style.css';

const message = (error: unknown) => error instanceof Error ? error.message : 'Unable to contact the application.';

function App() {
  const path = window.location.pathname;
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [today, setToday] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([
      api<{ rooms: Room[] }>('/rooms'),
      api<{ today: string }>('/health'),
      api<{ user: User }>('/auth/me').catch(error => {
        if (error instanceof RequestError && error.status === 401) return { user: null };
        throw error;
      }),
    ]).then(([catalog, health, account]) => {
      setRooms(catalog.rooms); setToday(health.today); setUser(account.user); setReady(true);
    }).catch(error => setError(message(error)));
  }, []);

  async function logout() {
    setBusy(true); setError('');
    try { await api('/auth/logout', {}); window.location.assign('/login?loggedOut=1'); }
    catch (error) { setError(message(error)); setBusy(false); }
  }
  return <>
    <header>
      <h1>Wee B&amp;B</h1>
      <nav aria-label="Main navigation">
        <a href="/">Rooms</a>{' '}
        {ready && (user ? <>
          {user.role === 'guest' ? <a href="/bookings">My bookings</a> : <a href="/admin">Administration</a>}{' '}
          <button disabled={busy} onClick={() => void logout()}>Log out</button>
        </> : <a href="/login">Log in</a>)}
      </nav>
      {user && <p>Signed in as {user.email} ({user.role === 'admin' ? 'Administrator' : 'Guest'})</p>}
    </header>
    <main>
      {error && <p role="alert">{error}</p>}
      {!ready && !error && <p role="status">Loading application…</p>}
      {ready && (path === '/' ? <Rooms rooms={rooms} user={user} today={today} />
        : path === '/login' ? <Login user={user} />
        : path === '/bookings' || path === '/admin' ? <Bookings user={user} rooms={rooms} admin={path === '/admin'} />
        : <h2>Page not found</h2>)}
    </main>
  </>;
}

function Login({ user }: { user: User | null }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const { user } = await api<{ user: User }>('/auth/login', { email: form.get('email'), password: form.get('password') });
      window.location.assign(user.role === 'admin' ? '/admin' : '/bookings');
    } catch (error) { setError(message(error)); setBusy(false); }
  }
  return <section aria-labelledby="login-heading">
    <h2 id="login-heading">Log in</h2>
    {new URLSearchParams(location.search).has('loggedOut') && <p role="status">You have logged out.</p>}
    {user ? <p>You are already signed in. Use the navigation to continue.</p> : <form onSubmit={event => void submit(event)}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={200} />
      <button disabled={busy} type="submit">Log in</button>
      {error && <p role="alert">{error}</p>}
    </form>}
  </section>;
}

function Rooms({ rooms, user, today }: { rooms: Room[]; user: User | null; today: string }) {
  return <section aria-labelledby="rooms-heading">
    <h2 id="rooms-heading">Our rooms</h2>
    <p>Choose dates to book a room. Arrival is inclusive and departure is exclusive. Dates use UTC.</p>
    {rooms.map(room => <article key={room.id} aria-labelledby={`${room.id}-heading`}>
      <h3 id={`${room.id}-heading`}>{room.name}</h3>
      <p>{room.description}</p><p>{money(room.nightlyPrice)} per night</p>
      {user?.role === 'guest' ? <BookingForm room={room} today={today} />
        : !user ? <a href="/login">Log in to book {room.name}</a> : null}
    </article>)}
  </section>;
}

function BookingForm({ room, today }: { room: Room; today: string }) {
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true);
    try {
      const { booking } = await api<{ booking: Booking }>('/bookings', { roomId: room.id, arrival, departure });
      setSuccess(`Booking confirmed: ${room.name}, ${booking.arrival} to ${booking.departure}. Total ${money(booking.total)}. Reference ${booking.id}.`);
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  return <form aria-label={`Book ${room.name}`} onSubmit={event => void submit(event)}>
    <label htmlFor={`${room.id}-arrival`}>Arrival</label>
    <input id={`${room.id}-arrival`} type="date" required min={today} value={arrival} onChange={event => { setArrival(event.target.value); setSuccess(''); }} />
    <label htmlFor={`${room.id}-departure`}>Departure</label>
    <input id={`${room.id}-departure`} type="date" required min={arrival || today} value={departure} onChange={event => { setDeparture(event.target.value); setSuccess(''); }} />
    <button disabled={busy} type="submit">Reserve {room.name}</button>
    {error && <p role="alert">{error}</p>}
    {success && <p role="status">{success} <a href="/bookings">View my bookings</a></p>}
  </form>;
}

function Bookings({ user, rooms, admin }: { user: User | null; rooms: Room[]; admin: boolean }) {
  const allowed = user?.role === (admin ? 'admin' : 'guest');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!allowed) return;
    api<{ bookings: Booking[] }>(admin ? '/admin/bookings' : '/bookings')
      .then(data => { setBookings(data.bookings); setLoaded(true); })
      .catch(error => setError(message(error)));
  }, [allowed, admin]);

  async function cancel(id: string) {
    setBusy(true); setError(''); setSuccess('');
    try {
      const { booking } = await api<{ booking: Booking }>(`/bookings/${id}/cancel`, {});
      setBookings(items => items.map(item => item.id === id ? { ...item, ...booking } : item));
      setSuccess(`Booking ${id} cancelled.`);
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="bookings-heading">
    <h2 id="bookings-heading">{admin ? 'Administration — All bookings' : 'My bookings'}</h2>
    {!allowed ? <p role="alert">{!user ? <><a href="/login">Log in</a> to continue.</> : 'Access denied.'}</p> : <>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
      {!loaded && !error && <p role="status">Loading bookings…</p>}
      {loaded && bookings.length === 0 && <p>No bookings yet.</p>}
      {bookings.map(booking => <article key={booking.id} aria-labelledby={`${booking.id}-heading`}>
        <h3 id={`${booking.id}-heading`}>{rooms.find(room => room.id === booking.roomId)?.name} — {booking.id}</h3>
        {admin && <p>Guest: {booking.ownerEmail}</p>}
        <p>{booking.arrival} to {booking.departure}</p>
        <p>{money(booking.nightlyPrice)} per night · Total {money(booking.total)}</p>
        <p>Status: {booking.status}</p>
        {booking.status === 'active' && <button disabled={busy} onClick={() => void cancel(booking.id)}>Cancel {booking.id}</button>}
      </article>)}
    </>}
  </section>;
}

createRoot(document.getElementById('root')!).render(<App />);
