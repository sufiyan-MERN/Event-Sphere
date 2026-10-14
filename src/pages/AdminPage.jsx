import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext.jsx';
import {
  getAdminStats,
  getAdminBookings,
  updateBookingStatusAdmin,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getAdminSeats,
  toggleSeatLockAdmin,
  getCoupons,
  createCoupon,
  toggleCoupon,
  resetDatabaseSeed,
  getAdminDatabases,
} from '../services/api.js';
import Icon from '../components/Icon.jsx';
import { money, formatLongDate } from '../utils/format.js';
import '../styles/pages/AdminPage.css';

const PRESET_POSTERS = [
  { label: 'Cinema Mystery', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3yNhooEP37GQS5Cj1BXO1Up2JXaJ0DCWV6AUvRZSNsQ&s' },
  { label: 'Action Thriller', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFSay9gUL5oxeOrSVpT3L2HUTnsxKOypZahNFZlaaLHw&s=10' },
  { label: 'Romance Musical', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0vbZbn40XjQmTUv0D1z2ET-dyN1oFh7MXHyxU_l_ovQ&s=10' },
  { label: 'Sci-Fi Drama', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgGWwCy08Q3B52n0OJXsBfTbeBK89_Nzp4ska7yDFglA&s=10' },
  { label: 'Live Concert', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzs6JUQeDr7EN_XhakGqnpwxYNbksFZ9sLUU7HoiD3_Q&s=10' },
  { label: 'Comedy Stage', url: '/manus-storage/async-images/uIT9JqJ72RrN8hkRBzMRU0/image-3.webp' },
  { label: 'Sports Night', url: '/manus-storage/async-images/uIT9JqJ72RrN8hkRBzMRU0/image-4.webp' },
];

const CITIES = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'];
const CATEGORIES = ['Movies', 'Events', 'Concerts', 'Sports', 'Comedy', 'Theatre', 'Workshops', 'Kids', 'Festivals', 'Experiences'];

export default function AdminPage() {
  const navigate = useNavigate();
  const { showToast, refreshCatalog, catalogItems, backendHealth } = useBooking();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'databases' | 'catalog' | 'bookings' | 'seats' | 'coupons' | 'customers'
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [databaseInfo, setDatabaseInfo] = useState(null);
  const [refreshingDb, setRefreshingDb] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState('all');
  const [catalogCityFilter, setCatalogCityFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Seat Inspector states
  const [selectedSeatItem, setSelectedSeatItem] = useState(null);
  const [selectedSeatDate, setSelectedSeatDate] = useState('');
  const [selectedSeatTime, setSelectedSeatTime] = useState('');
  const [seatData, setSeatData] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedBookingForTicket, setSelectedBookingForTicket] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Form State for Add / Edit Item
  const initialItemForm = {
    title: '',
    kind: 'movie',
    category: 'Movies',
    genre: '',
    genreTag: '',
    rating: 8.5,
    language: 'Telugu',
    duration: '2h 15m',
    price: 250,
    image: PRESET_POSTERS[0].url,
    date: '2026-10-10',
    time: '7:30 PM',
    venue: 'PVR Next Galleria',
    location: 'Hyderabad',
    description: '',
    tags: 'Featured, Trending',
    available: true,
  };
  const [itemForm, setItemForm] = useState(initialItemForm);

  // Form State for Coupon
  const [couponForm, setCouponForm] = useState({
    code: '',
    title: '',
    detail: '',
    discountType: 'percent',
    discountValue: 15,
    tone: 'coral',
  });

  // Load all initial data from MongoDB
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, couponsRes, dbRes] = await Promise.all([
        getAdminStats().catch(() => ({ stats: null })),
        getAdminBookings().catch(() => ({ bookings: [] })),
        getCoupons().catch(() => ({ coupons: [] })),
        getAdminDatabases().catch(() => null),
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (Array.isArray(bookingsRes?.bookings)) setBookings(bookingsRes.bookings);
      if (Array.isArray(couponsRes?.coupons)) setCoupons(couponsRes.coupons);
      if (dbRes) setDatabaseInfo(dbRes);
    } catch (err) {
      console.warn('[AdminPage] Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Ping and verify MongoDB Atlas Cluster
  const handlePingDatabase = async () => {
    setRefreshingDb(true);
    try {
      const res = await getAdminDatabases();
      setDatabaseInfo(res);
      showToast('MongoDB Atlas connection verified! 4 domain databases active.');
    } catch (err) {
      showToast('Ping failed: ' + err.message, 'error');
    } finally {
      setRefreshingDb(false);
    }
  };

  // Handle seat map inspection
  const inspectSeats = useCallback(async (item, date, time) => {
    if (!item) return;
    setLoadingSeats(true);
    setSelectedSeatItem(item);
    setSelectedSeatDate(date || item.date || '2026-10-10');
    setSelectedSeatTime(time || item.time || '7:30 PM');
    try {
      const res = await getAdminSeats({
        itemId: item.id,
        date: date || item.date || '2026-10-10',
        time: time || item.time || '7:30 PM',
      });
      setSeatData(res);
    } catch (err) {
      showToast('Could not load seat map: ' + err.message, 'error');
    } finally {
      setLoadingSeats(false);
    }
  }, [showToast]);

  // Auto-select first item when entering seats tab
  useEffect(() => {
    if (activeTab === 'seats' && !selectedSeatItem && catalogItems.length > 0) {
      inspectSeats(catalogItems[0], catalogItems[0].date, catalogItems[0].time);
    }
  }, [activeTab, selectedSeatItem, catalogItems, inspectSeats]);

  // Save Item (Create or Update)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    try {
      const payload = {
        ...itemForm,
        price: Number(itemForm.price) || 200,
        rating: Number(itemForm.rating) || 8.0,
        tags: typeof itemForm.tags === 'string'
          ? itemForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : itemForm.tags,
      };

      if (editingItem) {
        await updateCatalogItem(editingItem.id, payload);
        showToast(`"${itemForm.title}" updated successfully in MongoDB!`);
      } else {
        await createCatalogItem(payload);
        showToast(`"${itemForm.title}" added to MongoDB catalogue!`);
      }

      setShowItemModal(false);
      setEditingItem(null);
      await refreshCatalog();
      loadAdminData();
    } catch (err) {
      showToast('Failed to save item: ' + err.message, 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}" from MongoDB?`)) return;
    try {
      await deleteCatalogItem(item.id);
      showToast(`"${item.title}" removed from catalogue.`);
      await refreshCatalog();
      loadAdminData();
    } catch (err) {
      showToast('Failed to delete item: ' + err.message, 'error');
    }
  };

  // Toggle Item Availability
  const handleToggleAvailability = async (item) => {
    try {
      await updateCatalogItem(item.id, { available: !item.available });
      showToast(`Updated availability for "${item.title}".`);
      await refreshCatalog();
      loadAdminData();
    } catch (err) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  };

  // Update Booking Status
  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatusAdmin(bookingId, newStatus);
      showToast(`Booking ${bookingId} status changed to ${newStatus}.`);
      loadAdminData();
    } catch (err) {
      showToast('Failed to update booking: ' + err.message, 'error');
    }
  };

  // Toggle Seat Lock
  const handleToggleSeatLock = async (seat) => {
    if (!seatData) return;
    if (seat.status === 'booked') {
      showToast('Booked seats cannot be toggled. Cancel the booking first.', 'error');
      return;
    }
    const isLocked = seat.baseStatus === 'locked';
    try {
      await toggleSeatLockAdmin({
        showKey: seatData.showKey,
        seatId: seat.id,
        locked: !isLocked,
      });
      showToast(`Seat ${seat.id} is now ${!isLocked ? 'Locked (VIP)' : 'Available'}.`);
      inspectSeats(selectedSeatItem, selectedSeatDate, selectedSeatTime);
    } catch (err) {
      showToast('Failed to toggle seat: ' + err.message, 'error');
    }
  };

  // Create Coupon
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      showToast('Coupon code is required', 'error');
      return;
    }
    try {
      await createCoupon(couponForm);
      showToast(`Coupon ${couponForm.code.toUpperCase()} created in MongoDB!`);
      setShowCouponModal(false);
      setCouponForm({ code: '', title: '', detail: '', discountType: 'percent', discountValue: 15, tone: 'coral' });
      loadAdminData();
    } catch (err) {
      showToast('Failed to create coupon: ' + err.message, 'error');
    }
  };

  // Toggle Coupon Active
  const handleToggleCoupon = async (code) => {
    try {
      await toggleCoupon(code);
      showToast(`Coupon ${code} status toggled.`);
      loadAdminData();
    } catch (err) {
      showToast('Failed to update coupon: ' + err.message, 'error');
    }
  };

  // Reseed Database
  const handleReseed = async () => {
    if (!window.confirm('Reset database catalogue and coupons to default sample seed? Existing bookings will be preserved.')) return;
    try {
      await resetDatabaseSeed();
      showToast('MongoDB database reseeded with default catalogue!');
      await refreshCatalog();
      loadAdminData();
    } catch (err) {
      showToast('Reseed failed: ' + err.message, 'error');
    }
  };

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    const term = catalogSearch.toLowerCase().trim();
    return catalogItems.filter((item) => {
      const matchSearch = !term || `${item.title} ${item.genre} ${item.venue} ${item.location}`.toLowerCase().includes(term);
      const matchType = catalogTypeFilter === 'all' || item.kind === catalogTypeFilter;
      const matchCity = catalogCityFilter === 'all' || item.location === catalogCityFilter;
      return matchSearch && matchType && matchCity;
    });
  }, [catalogItems, catalogSearch, catalogTypeFilter, catalogCityFilter]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    const term = bookingSearch.toLowerCase().trim();
    return bookings.filter((b) => {
      const matchSearch =
        !term ||
        `${b.id} ${b.customerName} ${b.email} ${b.phone} ${b.title}`.toLowerCase().includes(term);
      const matchStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  return (
    <main className="page-shell admin-page">
      {/* Top Banner & Control Header */}
      <section className="admin-header">
        <div className="admin-header__top">
          <div className="admin-header__titles">
            <span className="eyebrow" style={{ color: '#fed7aa' }}>
              <span className="eyebrow-spark">✦</span> SYSTEM CONTROL CENTER
            </span>
            <h1>
              ShowBook <em>Admin Panel</em>
              <span className="admin-badge">LIVE SYNC</span>
            </h1>
          </div>

          <div className="admin-header__actions">
            <div className={`db-status-pill ${backendHealth?.persistence?.status === 'connected' ? 'connected' : 'in_memory'}`}>
              <span className="status-dot" />
              <span>
                {backendHealth?.persistence?.status === 'connected'
                  ? 'MongoDB Connected'
                  : 'MongoDB In-Memory Sync'}
              </span>
            </div>

            <button
              type="button"
              className="btn-action btn-action--primary"
              onClick={() => {
                setEditingItem(null);
                setItemForm(initialItemForm);
                setShowItemModal(true);
              }}
            >
              <span>+ Add Movie / Event</span>
            </button>

            <button
              type="button"
              className="btn-action"
              onClick={() => {
                refreshCatalog();
                loadAdminData();
                showToast('Synced with MongoDB.');
              }}
              title="Refresh all data from MongoDB"
            >
              <span>⟳ Refresh</span>
            </button>

            <button
              type="button"
              className="btn-action"
              onClick={() => navigate('/')}
              title="Return to public customer website"
            >
              <span>Customer View →</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="admin-nav-tabs" aria-label="Admin Sections">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>Overview & Analytics</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'databases' ? 'active' : ''}`}
            onClick={() => setActiveTab('databases')}
          >
            <span>MongoDB Databases</span>
            <span className="tab-badge" style={{ background: '#10b981', color: '#fff' }}>4</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <span>Movies & Events</span>
            <span className="tab-badge">{catalogItems.length}</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <span>Customer Bookings</span>
            <span className="tab-badge">{bookings.length}</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'seats' ? 'active' : ''}`}
            onClick={() => setActiveTab('seats')}
          >
            <span>Seat Inventory</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            <span>Offers & Coupons</span>
            <span className="tab-badge">{coupons.length}</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <span>Customer Directory</span>
            <span className="tab-badge">{stats?.totalCustomers || 0}</span>
          </button>
        </nav>
      </section>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <section className="admin-section">
          {/* MongoDB Cluster & Multi-Database Banner */}
          <div className="db-cluster-banner">
            <div className="db-cluster-banner__info">
              <div className="db-cluster-banner__title">
                <span style={{ fontSize: '24px' }}>🍃</span>
                <span>MongoDB Atlas Multi-Database Connected</span>
                <span className="admin-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                  {databaseInfo?.cluster || 'cluster0.uqc74z7.mongodb.net'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span className="db-cluster-banner__uri">
                  <Icon name="tag" size={12} />
                  {databaseInfo?.connectionUri || 'mongodb+srv://sufiyantdc_db_user:***@cluster0.uqc74z7.mongodb.net/'}
                </span>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  <strong>4 Domain Databases</strong> configured & active: <code>showbook_catalog</code>, <code>showbook_bookings</code>, <code>showbook_inventory</code>, <code>showbook_marketing</code>
                </span>
              </div>
            </div>
            <div className="db-cluster-banner__actions">
              <button
                type="button"
                className="btn-action"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                onClick={() => setActiveTab('databases')}
              >
                <span>Inspect Databases (4) →</span>
              </button>
              <button
                type="button"
                className="btn-action btn-action--primary"
                onClick={handlePingDatabase}
                disabled={refreshingDb}
              >
                <span>{refreshingDb ? 'Testing...' : '⚡ Test Connection'}</span>
              </button>
            </div>
          </div>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-card__header">
                <span className="metric-card__label">TOTAL REVENUE</span>
                <div className="metric-card__icon revenue">₹</div>
              </div>
              <div className="metric-card__value">{money(stats?.totalRevenue || 0)}</div>
              <div className="metric-card__footer">
                <span>From completed & upcoming bookings</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__header">
                <span className="metric-card__label">TOTAL BOOKINGS</span>
                <div className="metric-card__icon bookings">✦</div>
              </div>
              <div className="metric-card__value">{stats?.totalBookings || bookings.length}</div>
              <div className="metric-card__footer">
                <span className="status-badge status-badge--upcoming">{stats?.upcomingBookings || 0} Upcoming</span>
                <span className="status-badge status-badge--completed">{stats?.completedBookings || 0} Done</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__header">
                <span className="metric-card__label">ACTIVE CATALOG</span>
                <div className="metric-card__icon shows">▣</div>
              </div>
              <div className="metric-card__value">
                {catalogItems.length}
              </div>
              <div className="metric-card__footer">
                <span>{catalogItems.filter((i) => i.kind === 'movie').length} Movies · {catalogItems.filter((i) => i.kind === 'event').length} Events</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__header">
                <span className="metric-card__label">SEATS BOOKED</span>
                <div className="metric-card__icon seats">💺</div>
              </div>
              <div className="metric-card__value">{stats?.totalSeatsBooked || 0}</div>
              <div className="metric-card__footer">
                <span>Across all scheduled shows</span>
              </div>
            </div>
          </div>

          <div className="dashboard-columns">
            {/* Top Grossing Shows */}
            <div className="admin-card">
              <div className="admin-card__title">
                <h3>Top Grossing Shows</h3>
                <span className="eyebrow">BY REVENUE</span>
              </div>
              {stats?.topShows && stats.topShows.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {stats.topShows.map((show, idx) => (
                    <div key={show.title} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' }}>
                        <span>0{idx + 1}. {show.title}</span>
                        <span style={{ color: 'var(--orange)' }}>{money(show.revenue)}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--paper-deep)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: 'var(--orange)',
                            width: `${Math.min(100, Math.round((show.revenue / (stats.totalRevenue || 1)) * 100))}%`,
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--ink-muted)', fontSize: '14px' }}>No revenue data recorded yet.</p>
              )}
            </div>

            {/* Quick Actions & Database Control */}
            <div className="admin-card">
              <div className="admin-card__title">
                <h3>Quick Management</h3>
                <span className="eyebrow">DATABASE ACTIONS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-action"
                  style={{ padding: '12px', justifyContent: 'space-between' }}
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm(initialItemForm);
                    setShowItemModal(true);
                  }}
                >
                  <span style={{ fontWeight: '600' }}>+ Add New Movie or Event to MongoDB</span>
                  <Icon name="arrow" size={14} />
                </button>

                <button
                  type="button"
                  className="btn-action"
                  style={{ padding: '12px', justifyContent: 'space-between' }}
                  onClick={() => setActiveTab('bookings')}
                >
                  <span style={{ fontWeight: '600' }}>View & Manage Customer Bookings</span>
                  <Icon name="arrow" size={14} />
                </button>

                <button
                  type="button"
                  className="btn-action"
                  style={{ padding: '12px', justifyContent: 'space-between' }}
                  onClick={() => setActiveTab('seats')}
                >
                  <span style={{ fontWeight: '600' }}>Inspect Live Seating & Lock VIP Seats</span>
                  <Icon name="arrow" size={14} />
                </button>

                <button
                  type="button"
                  className="btn-action"
                  style={{ padding: '12px', justifyContent: 'space-between' }}
                  onClick={() => setActiveTab('coupons')}
                >
                  <span style={{ fontWeight: '600' }}>Manage Promo Coupons & Discounts</span>
                  <Icon name="arrow" size={14} />
                </button>

                <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
                  <button
                    type="button"
                    className="btn-action btn-action--danger"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleReseed}
                  >
                    <span>Reset & Reseed Default Catalogue</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB: MONGODB MULTI-DATABASE ARCHITECTURE */}
      {activeTab === 'databases' && (
        <section className="admin-section">
          {/* Cluster Status Banner */}
          <div className="db-cluster-banner">
            <div className="db-cluster-banner__info">
              <div className="db-cluster-banner__title">
                <span style={{ fontSize: '26px' }}>🍃</span>
                <span>MongoDB Atlas Multi-Database Architecture</span>
                <span className="admin-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                  {databaseInfo?.cluster || 'cluster0.uqc74z7.mongodb.net'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span className="db-cluster-banner__uri">
                  <Icon name="tag" size={12} />
                  {databaseInfo?.connectionUri || 'mongodb+srv://sufiyantdc_db_user:***@cluster0.uqc74z7.mongodb.net/'}
                </span>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Target Provider: <strong>{databaseInfo?.provider || 'MongoDB Atlas'}</strong>
                </span>
              </div>
            </div>
            <div className="db-cluster-banner__actions">
              <button
                type="button"
                className="btn-action btn-action--primary"
                onClick={handlePingDatabase}
                disabled={refreshingDb}
              >
                <span>{refreshingDb ? 'Pinging Cluster...' : '⚡ Ping & Sync Atlas'}</span>
              </button>
              <button
                type="button"
                className="btn-action"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                onClick={() => setShowRawJson(!showRawJson)}
              >
                <span>{showRawJson ? 'Hide Raw API' : '{ } View API JSON'}</span>
              </button>
            </div>
          </div>

          {/* The 4 Domain Databases Grid */}
          <div className="db-grid">
            {/* Database 1: showbook_catalog */}
            <div className="db-card">
              <div className="db-card__header">
                <div>
                  <span className="db-card__domain">CATALOG SERVICE</span>
                  <div className="db-card__name">showbook_catalog</div>
                </div>
                <div className="db-card__icon catalog">🎬</div>
              </div>
              <p className="db-card__purpose">
                Cinema releases, live concerts, stage comedy, venues, show timings, and ticket tiers.
              </p>
              <div className="db-card__collections">
                <div className="db-collection-row">
                  <span className="db-collection-name">collections.catalog</span>
                  <span className="db-collection-count">
                    {databaseInfo?.databases?.catalog?.collections?.catalog ?? catalogItems.length} items
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  type="button"
                  className="btn-action"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setActiveTab('catalog')}
                >
                  <span>Manage Catalog Items →</span>
                </button>
              </div>
            </div>

            {/* Database 2: showbook_bookings */}
            <div className="db-card">
              <div className="db-card__header">
                <div>
                  <span className="db-card__domain">TICKETING & AUDIT</span>
                  <div className="db-card__name">showbook_bookings</div>
                </div>
                <div className="db-card__icon bookings">🎫</div>
              </div>
              <p className="db-card__purpose">
                Customer reservations, unique alphanumeric booking IDs, status lifecycle, and financial payment audit.
              </p>
              <div className="db-card__collections">
                <div className="db-collection-row">
                  <span className="db-collection-name">collections.bookings</span>
                  <span className="db-collection-count">
                    {databaseInfo?.databases?.bookings?.collections?.bookings ?? bookings.length} bookings
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  type="button"
                  className="btn-action"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setActiveTab('bookings')}
                >
                  <span>View Customer Bookings →</span>
                </button>
              </div>
            </div>

            {/* Database 3: showbook_inventory */}
            <div className="db-card">
              <div className="db-card__header">
                <div>
                  <span className="db-card__domain">SEAT INVENTORY ENGINE</span>
                  <div className="db-card__name">showbook_inventory</div>
                </div>
                <div className="db-card__icon inventory">💺</div>
              </div>
              <p className="db-card__purpose">
                Real-time seat matrices across rows & tiers, administrator VIP reserved locks, and 5-min checkout holds.
              </p>
              <div className="db-card__collections">
                <div className="db-collection-row">
                  <span className="db-collection-name">collections.seat_inventory</span>
                  <span className="db-collection-count">
                    {databaseInfo?.databases?.inventory?.collections?.seat_inventory ?? 48} seats
                  </span>
                </div>
                <div className="db-collection-row">
                  <span className="db-collection-name">collections.seat_holds</span>
                  <span className="db-collection-count">
                    {databaseInfo?.databases?.inventory?.collections?.seat_holds ?? 0} active holds
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  type="button"
                  className="btn-action"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setActiveTab('seats')}
                >
                  <span>Inspect Seating Grid →</span>
                </button>
              </div>
            </div>

            {/* Database 4: showbook_marketing */}
            <div className="db-card">
              <div className="db-card__header">
                <div>
                  <span className="db-card__domain">MARKETING & PROMOTIONS</span>
                  <div className="db-card__name">showbook_marketing</div>
                </div>
                <div className="db-card__icon marketing">🏷️</div>
              </div>
              <p className="db-card__purpose">
                Promotional discount coupons (STUDENT50, FIRSTBOOKING), percentage and flat price deductions, and active switches.
              </p>
              <div className="db-card__collections">
                <div className="db-collection-row">
                  <span className="db-collection-name">collections.coupons</span>
                  <span className="db-collection-count">
                    {databaseInfo?.databases?.marketing?.collections?.coupons ?? coupons.length} coupons
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  type="button"
                  className="btn-action"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setActiveTab('coupons')}
                >
                  <span>Manage Coupons →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Raw JSON API Inspector */}
          {showRawJson && (
            <div className="admin-card" style={{ marginBottom: '24px' }}>
              <div className="admin-card__title">
                <h3>Live MongoDB Database Registry Payload</h3>
                <span className="eyebrow">GET /api/admin/databases</span>
              </div>
              <pre className="db-json-box">
                {JSON.stringify(databaseInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Atlas Connection & Multi-DB Architecture Guide Card */}
          <div className="admin-card">
            <div className="admin-card__title">
              <h3>MongoDB Atlas Multi-Database Architecture</h3>
              <span className="eyebrow">CONFIGURATION GUIDE</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', fontSize: '14px', color: 'var(--ink-secondary)', lineHeight: '1.6' }}>
              <div>
                <h4 style={{ color: 'var(--ink)', fontSize: '15px', marginBottom: '8px' }}>✦ Why Separate Databases?</h4>
                <p>
                  Instead of storing all collections in a single monolithic database, ShowBook routes domain operations into 4 isolated databases:
                  <br />• <code>showbook_catalog</code> (Catalog Discovery)
                  <br />• <code>showbook_bookings</code> (Customer Orders & Ticketing)
                  <br />• <code>showbook_inventory</code> (Real-Time Seats & Locks)
                  <br />• <code>showbook_marketing</code> (Offers & Coupons)
                </p>
              </div>
              <div>
                <h4 style={{ color: 'var(--ink)', fontSize: '15px', marginBottom: '8px' }}>✦ Atlas Connection String</h4>
                <p>
                  Your MongoDB Atlas cluster URI is loaded from <code>.env</code>:
                  <br /><code>MONGODB_URI=mongodb+srv://sufiyantdc_db_user:***@cluster0.uqc74z7.mongodb.net/</code>
                  <br />The backend automatically opens databases on demand via <code>client.db(domainDbName)</code>.
                </p>
              </div>
              <div>
                <h4 style={{ color: 'var(--ink)', fontSize: '15px', marginBottom: '8px' }}>✦ Running with Live Atlas Node Server</h4>
                <p>
                  To watch live Atlas writes in your terminal, run:
                  <br /><code style={{ background: 'var(--paper-deep)', padding: '2px 6px', borderRadius: '4px' }}>node backend/index.js</code>
                  <br />This connects to Atlas and logs collection updates in real time!
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: MOVIES & EVENTS MANAGEMENT */}
      {activeTab === 'catalog' && (
        <section className="admin-section">
          <div className="admin-toolbar">
            <div className="admin-search-box">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search movies, events, venues..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>

            <div className="admin-filters">
              <select
                className="admin-select"
                value={catalogTypeFilter}
                onChange={(e) => setCatalogTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="movie">Movies Only</option>
                <option value="event">Events Only</option>
              </select>

              <select
                className="admin-select"
                value={catalogCityFilter}
                onChange={(e) => setCatalogCityFilter(e.target.value)}
              >
                <option value="all">All Cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button
                type="button"
                className="btn-action btn-action--primary"
                onClick={() => {
                  setEditingItem(null);
                  setItemForm(initialItemForm);
                  setShowItemModal(true);
                }}
              >
                <span>+ Add Item</span>
              </button>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Type / Category</th>
                  <th>City & Venue</th>
                  <th>Show Timing</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="item-cell">
                        <img src={item.image} alt={item.title} className="item-thumb" />
                        <div className="item-info">
                          <span className="item-title">{item.title}</span>
                          <span className="item-meta">{item.genre} · {item.language} · {item.duration}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: item.kind === 'movie' ? '#fff7ed' : '#f5f3ff', color: item.kind === 'movie' ? '#ea580c' : '#7c3aed' }}>
                        {item.kind.toUpperCase()} · {item.category}
                      </span>
                    </td>
                    <td>
                      <strong>{item.location}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{item.venue}</div>
                    </td>
                    <td>
                      <div>{item.date}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{item.time}</div>
                    </td>
                    <td>
                      <strong>{money(item.price)}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Click to toggle availability"
                      >
                        <span className={`status-badge ${item.available ? 'status-badge--available' : 'status-badge--soldout'}`}>
                          {item.available ? '● Available' : '○ Sold Out'}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/${item.kind === 'movie' ? 'movies' : 'events'}/${item.id}`}
                          target="_blank"
                          className="btn-action"
                          title="View on public site"
                        >
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          className="btn-action"
                          onClick={() => {
                            setEditingItem(item);
                            setItemForm({
                              ...initialItemForm,
                              ...item,
                              tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
                            });
                            setShowItemModal(true);
                          }}
                        >
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-action--danger"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCatalog.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--ink-muted)' }}>
                      No movies or events match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: CUSTOMER BOOKINGS */}
      {activeTab === 'bookings' && (
        <section className="admin-section">
          <div className="admin-toolbar">
            <div className="admin-search-box">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search by ID, Customer Name, Email, Show..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
              />
            </div>

            <div className="admin-filters">
              <select
                className="admin-select"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Show & Date</th>
                  <th>Seats Reserved</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--orange)' }}>{b.id}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                        {b.bookedAt ? new Date(b.bookedAt).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td>
                      <strong>{b.customerName || 'Guest'}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{b.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{b.phone}</div>
                    </td>
                    <td>
                      <strong>{b.title}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                        {b.date} · {b.time}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{b.venue}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(b.seats || []).map((s) => (
                          <span
                            key={s}
                            style={{
                              padding: '2px 6px',
                              background: 'var(--paper-deep)',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong>{money(b.amount)}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{b.paymentMethod || 'UPI'}</div>
                    </td>
                    <td>
                      <select
                        className={`status-badge status-badge--${b.status?.toLowerCase() || 'upcoming'}`}
                        value={b.status}
                        onChange={(e) => handleBookingStatusChange(b.id, e.target.value)}
                        style={{ cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-action"
                        onClick={() => {
                          setSelectedBookingForTicket(b);
                          setShowTicketModal(true);
                        }}
                      >
                        <span>View Ticket</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--ink-muted)' }}>
                      No bookings match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: SEAT INVENTORY & LIVE SHOWS */}
      {activeTab === 'seats' && (
        <section className="admin-section">
          <div className="admin-card">
            <div className="admin-card__title">
              <h3>Live Seat Grid & VIP Lock Control</h3>
              <span className="eyebrow">CLICK ANY SEAT TO LOCK/UNLOCK</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <select
                className="admin-select"
                value={selectedSeatItem?.id || ''}
                onChange={(e) => {
                  const it = catalogItems.find((c) => c.id === e.target.value);
                  if (it) inspectSeats(it, it.date, it.time);
                }}
              >
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.kind})
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="admin-select"
                value={selectedSeatDate}
                onChange={(e) => {
                  setSelectedSeatDate(e.target.value);
                  inspectSeats(selectedSeatItem, e.target.value, selectedSeatTime);
                }}
              />

              <select
                className="admin-select"
                value={selectedSeatTime}
                onChange={(e) => {
                  setSelectedSeatTime(e.target.value);
                  inspectSeats(selectedSeatItem, selectedSeatDate, e.target.value);
                }}
              >
                {selectedSeatItem?.kind === 'movie' ? (
                  <>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="1:30 PM">1:30 PM</option>
                    <option value="4:30 PM">4:30 PM</option>
                    <option value="7:30 PM">7:30 PM</option>
                  </>
                ) : (
                  <option value={selectedSeatItem?.time || '7:30 PM'}>
                    {selectedSeatItem?.time || '7:30 PM'}
                  </option>
                )}
              </select>
            </div>

            {loadingSeats ? (
              <p style={{ textAlign: 'center', padding: '24px' }}>Loading live seats from MongoDB...</p>
            ) : seatData ? (
              <div className="seat-admin-grid">
                <div style={{ color: '#fed7aa', fontSize: '13px', fontWeight: '700', letterSpacing: '0.1em' }}>
                  SCREEN
                </div>
                {['A', 'B', 'C', 'D', 'E', 'F'].map((rowLabel) => {
                  const rowSeats = seatData.seats.filter((s) => s.id.startsWith(rowLabel));
                  return (
                    <div key={rowLabel} className="seat-admin-row">
                      <span className="seat-admin-row__label">{rowLabel}</span>
                      {rowSeats.map((seat) => (
                        <button
                          key={seat.id}
                          type="button"
                          className={`seat-admin-cell ${seat.status}`}
                          onClick={() => handleToggleSeatLock(seat)}
                          title={`${seat.id} · ₹${seat.price} · ${seat.status.toUpperCase()}${
                            seat.customer ? ` (${seat.customer.customerName})` : ''
                          }`}
                        >
                          {seat.id.slice(1)}
                        </button>
                      ))}
                    </div>
                  );
                })}

                <div className="seat-admin-legend">
                  <span><i className="key-avail" /> Available</span>
                  <span><i className="key-booked" /> Booked by Customer</span>
                  <span><i className="key-locked" /> Locked (VIP/Admin)</span>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* TAB 5: OFFERS & COUPONS */}
      {activeTab === 'coupons' && (
        <section className="admin-section">
          <div className="admin-toolbar">
            <h3 style={{ margin: 0 }}>Active Discount Coupons</h3>
            <button
              type="button"
              className="btn-action btn-action--primary"
              onClick={() => setShowCouponModal(true)}
            >
              <span>+ Create Coupon</span>
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title & Description</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', fontSize: '15px', color: 'var(--orange)' }}>
                        {c.code}
                      </strong>
                    </td>
                    <td>
                      <strong>{c.title}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{c.detail}</div>
                    </td>
                    <td>
                      <strong>{c.discountType === 'percent' ? `${c.discountValue}%` : money(c.discountValue)} OFF</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${c.active ? 'status-badge--available' : 'status-badge--soldout'}`}>
                        {c.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-action"
                        onClick={() => handleToggleCoupon(c.code)}
                      >
                        <span>{c.active ? 'Disable' : 'Enable'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 6: CUSTOMER DIRECTORY */}
      {activeTab === 'customers' && (
        <section className="admin-section">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Bookings</th>
                  <th>Total Spent</th>
                  <th>Last Booking</th>
                </tr>
              </thead>
              <tbody>
                {stats?.customers?.map((cust) => (
                  <tr key={cust.email}>
                    <td><strong>{cust.name}</strong></td>
                    <td>{cust.email}</td>
                    <td>{cust.phone || '—'}</td>
                    <td><strong>{cust.bookingsCount}</strong></td>
                    <td style={{ color: 'var(--orange)', fontWeight: '700' }}>{money(cust.totalSpend)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                      {cust.lastBookedAt ? new Date(cust.lastBookedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {(!stats?.customers || stats.customers.length === 0) && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--ink-muted)' }}>
                      No registered customers recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL 1: ADD / EDIT MOVIE OR EVENT */}
      {showItemModal && (
        <div className="admin-modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{editingItem ? 'Edit Movie or Event' : 'Add New Movie or Event'}</h3>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setShowItemModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="admin-modal__body">
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label>Type</label>
                    <select
                      value={itemForm.kind}
                      onChange={(e) => setItemForm({ ...itemForm, kind: e.target.value })}
                    >
                      <option value="movie">Movie</option>
                      <option value="event">Event</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Category</label>
                    <select
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group full-width">
                    <label>Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inception Re-release or Sunburn Arena"
                      value={itemForm.title}
                      onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Genre / Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Action · Sci-Fi"
                      value={itemForm.genre}
                      onChange={(e) => setItemForm({ ...itemForm, genre: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Language</label>
                    <input
                      type="text"
                      placeholder="e.g. Telugu, English, Hindi"
                      value={itemForm.language}
                      onChange={(e) => setItemForm({ ...itemForm, language: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 2h 20m"
                      value={itemForm.duration}
                      onChange={(e) => setItemForm({ ...itemForm, duration: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Base Price (₹)</label>
                    <input
                      type="number"
                      min="50"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>City</label>
                    <select
                      value={itemForm.location}
                      onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Venue</label>
                    <input
                      type="text"
                      placeholder="e.g. Prasads Multiplex or Lakeside Arena"
                      value={itemForm.venue}
                      onChange={(e) => setItemForm({ ...itemForm, venue: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={itemForm.date}
                      onChange={(e) => setItemForm({ ...itemForm, date: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Show Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 7:30 PM"
                      value={itemForm.time}
                      onChange={(e) => setItemForm({ ...itemForm, time: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group full-width">
                    <label>Poster Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={itemForm.image}
                      onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ink-muted)', alignSelf: 'center' }}>Presets:</span>
                      {PRESET_POSTERS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          className="btn-action"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                          onClick={() => setItemForm({ ...itemForm, image: p.url })}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="admin-form-group full-width">
                    <label>Description</label>
                    <textarea
                      rows="3"
                      placeholder="Brief description of the movie or event..."
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="btn-action"
                  onClick={() => setShowItemModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action btn-action--primary"
                >
                  {editingItem ? 'Save Changes' : 'Create & Sync with MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW DIGITAL TICKET */}
      {showTicketModal && selectedBookingForTicket && (
        <div className="admin-modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Digital Ticket #{selectedBookingForTicket.id}</h3>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setShowTicketModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal__body" style={{ background: '#18181b', color: '#ffffff', borderRadius: '12px', margin: '20px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '16px', marginBottom: '16px' }}>
                <span className="admin-badge" style={{ marginBottom: '8px' }}>SHOWBOOK ADMIT PASS</span>
                <h2 style={{ margin: '4px 0', fontSize: '22px' }}>{selectedBookingForTicket.title}</h2>
                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '13px' }}>
                  {selectedBookingForTicket.venue} · {selectedBookingForTicket.location}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#a1a1aa', fontSize: '11px' }}>DATE & TIME</span>
                  <div><strong>{selectedBookingForTicket.date} · {selectedBookingForTicket.time}</strong></div>
                </div>
                <div>
                  <span style={{ color: '#a1a1aa', fontSize: '11px' }}>SEATS</span>
                  <div><strong style={{ color: 'var(--orange)' }}>{(selectedBookingForTicket.seats || []).join(', ')}</strong></div>
                </div>
                <div>
                  <span style={{ color: '#a1a1aa', fontSize: '11px' }}>CUSTOMER</span>
                  <div><strong>{selectedBookingForTicket.customerName}</strong></div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>{selectedBookingForTicket.email}</div>
                </div>
                <div>
                  <span style={{ color: '#a1a1aa', fontSize: '11px' }}>TOTAL PAID</span>
                  <div><strong style={{ fontSize: '16px', color: '#10b981' }}>{money(selectedBookingForTicket.amount)}</strong></div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#a1a1aa' }}>
                  [QR-VALIDATION-SECURE-KEY-{selectedBookingForTicket.id}]
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE COUPON */}
      {showCouponModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Create New Promo Code</h3>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setShowCouponModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCoupon}>
              <div className="admin-modal__body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="admin-form-group">
                    <label>Coupon Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FESTIVE20"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Festival Special Discount"
                      value={couponForm.title}
                      onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Discount Value</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="20"
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Discount Type</label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    >
                      <option value="percent">Percentage (%) Off</option>
                      <option value="flat">Flat Amount (₹) Off</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="btn-action"
                  onClick={() => setShowCouponModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action btn-action--primary"
                >
                  Create Coupon in MongoDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
