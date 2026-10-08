import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getItem, seedBookings } from "../data/content.js";
import { readStored, STORAGE_KEYS, writeStored } from "../utils/storage.js";

const defaultProfile = {
  name: "Aarav Mehta",
  email: "aarav@example.com",
  phone: "+91 98765 43210",
  avatar: "AM",
};

const defaultDraft = {
  itemId: null,
  date: "2026-10-10",
  show: "7:30 PM",
  selectedSeats: [],
  coupon: "",
  customer: defaultProfile,
  paymentMethod: "UPI",
};

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [location, setLocationState] = useState(() =>
    readStored(STORAGE_KEYS.location, "Hyderabad"),
  );
  const [profile, setProfileState] = useState(() =>
    readStored(STORAGE_KEYS.profile, defaultProfile),
  );
  const [bookings, setBookings] = useState(() =>
    readStored(STORAGE_KEYS.bookings, seedBookings),
  );
  const [lastConfirmedBookingId, setLastConfirmedBookingId] = useState(() =>
    readStored(STORAGE_KEYS.lastConfirmedBookingId, null),
  );
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    readStored(STORAGE_KEYS.isAuthenticated, true),
  );
  const [favorites, setFavorites] = useState(() =>
    readStored(STORAGE_KEYS.favorites, ["monsoon-letters", "indie-after-dark"]),
  );
  const [preferences, setPreferences] = useState(() =>
    readStored(STORAGE_KEYS.preferences, {
      preferredCategories: ["Movies", "Concerts"],
    }),
  );
  const [draft, setDraft] = useState(() =>
    readStored(STORAGE_KEYS.activeBooking, defaultDraft),
  );
  const [toast, setToast] = useState(null);

  useEffect(() => {
    writeStored(STORAGE_KEYS.location, location);
  }, [location]);
  useEffect(() => {
    writeStored(STORAGE_KEYS.profile, profile);
  }, [profile]);
  useEffect(() => {
    writeStored(STORAGE_KEYS.bookings, bookings);
  }, [bookings]);
  useEffect(() => {
    writeStored(STORAGE_KEYS.lastConfirmedBookingId, lastConfirmedBookingId);
  }, [lastConfirmedBookingId]);
  useEffect(() => {
    writeStored(STORAGE_KEYS.isAuthenticated, isAuthenticated);
  }, [isAuthenticated]);
  useEffect(() => {
    writeStored(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);
  useEffect(() => {
    writeStored(STORAGE_KEYS.preferences, preferences);
  }, [preferences]);
  useEffect(() => {
    writeStored(STORAGE_KEYS.activeBooking, draft);
  }, [draft]);

  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, id: Date.now() });
    window.setTimeout(
      () =>
        setToast((current) => (current?.message === message ? null : current)),
      3000,
    );
  }, []);

  const setLocation = useCallback((value) => setLocationState(value), []);
  const updateProfile = useCallback(
    (updates) => setProfileState((current) => ({ ...current, ...updates })),
    [],
  );
  const signIn = useCallback(() => setIsAuthenticated(true), []);
  const signOut = useCallback(() => setIsAuthenticated(false), []);

  const beginBooking = useCallback(
    (item, date = item?.date, show = item?.time) => {
      if (!item) return;
      setDraft({
        ...defaultDraft,
        itemId: item.id,
        date: date || "2026-10-10",
        show: show || "7:30 PM",
        customer: { ...profile },
      });
    },
    [profile],
  );

  const updateDraft = useCallback(
    (updates) => setDraft((current) => ({ ...current, ...updates })),
    [],
  );
  const toggleSeat = useCallback(
    (seat) =>
      setDraft((current) => {
        const exists = current.selectedSeats.some(
          (selected) => selected.id === seat.id,
        );
        return {
          ...current,
          selectedSeats: exists
            ? current.selectedSeats.filter(
                (selected) => selected.id !== seat.id,
              )
            : [...current.selectedSeats, seat].sort((a, b) =>
                a.id.localeCompare(b.id),
              ),
        };
      }),
    [],
  );
  const clearSeats = useCallback(
    () => setDraft((current) => ({ ...current, selectedSeats: [] })),
    [],
  );

  const toggleFavorite = useCallback(
    (itemId) =>
      setFavorites((current) =>
        current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : [...current, itemId],
      ),
    [],
  );

  const confirmBooking = useCallback(
    (pricing) => {
      const item = getItem(draft.itemId);
      if (!item || !draft.selectedSeats.length) return null;
      const now = new Date();
      const day = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const sequence = String(
        bookings.filter((booking) => booking.id.startsWith(`BK${day}`)).length +
          1,
      ).padStart(3, "0");
      const booking = {
        id: `BK${day}${sequence}`,
        itemId: item.id,
        title: item.title,
        kind: item.kind,
        poster: item.image,
        date: draft.date,
        time: draft.show,
        venue: item.venue,
        location: item.location,
        seats: draft.selectedSeats.map((seat) => seat.id),
        amount: pricing.total,
        ticketPrice: pricing.ticketPrice,
        convenienceFee: pricing.convenienceFee,
        taxes: pricing.taxes,
        discount: pricing.discount,
        customerName: draft.customer.name,
        email: draft.customer.email,
        phone: draft.customer.phone,
        status: "Upcoming",
        payment: "Successful",
        paymentMethod: draft.paymentMethod,
        coupon: draft.coupon,
        bookedAt: now.toISOString(),
      };
      setBookings((current) => [booking, ...current]);
      setLastConfirmedBookingId(booking.id);
      setProfileState((current) => ({
        ...current,
        ...draft.customer,
        avatar:
          draft.customer.name
            ?.split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "AM",
      }));
      setDraft((current) => ({ ...current, selectedSeats: [] }));
      return booking;
    },
    [bookings, draft],
  );

  const updateBookingStatus = useCallback((id, status) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id ? { ...booking, status } : booking,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      location,
      setLocation,
      profile,
      updateProfile,
      isAuthenticated,
      signIn,
      signOut,
      bookings,
      lastConfirmedBookingId,
      favorites,
      preferences,
      setPreferences,
      draft,
      updateDraft,
      beginBooking,
      toggleSeat,
      clearSeats,
      toggleFavorite,
      confirmBooking,
      updateBookingStatus,
      toast,
      showToast,
      dismissToast: () => setToast(null),
    }),
    [
      location,
      setLocation,
      profile,
      updateProfile,
      isAuthenticated,
      signIn,
      signOut,
      bookings,
      lastConfirmedBookingId,
      favorites,
      preferences,
      draft,
      updateDraft,
      beginBooking,
      toggleSeat,
      clearSeats,
      toggleFavorite,
      confirmBooking,
      updateBookingStatus,
      toast,
      showToast,
    ],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking() {
  const value = useContext(BookingContext);
  if (!value) throw new Error("useBooking must be used within BookingProvider");
  return value;
}
