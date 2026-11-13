import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, PlusCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import '../styles/Complaints.css';

const CATEGORIES = [
  'All',
  'Roads & Potholes',
  'Garbage & Waste',
  'Streetlights',
  'Water Supply & Leakage',
  'Drainage & Sewage',
  'Public Property Damage',
  'Other',
];

const STATUSES = ['All', 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

const ComplaintsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'newest');

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);
      params.append('sort_by', sortBy);

      const res = await api.get(`/complaints?${params.toString()}`);
      setComplaints(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load public complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [category, status, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleVoteChange = (complaintId, newCount, hasUpvoted) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId ? { ...c, upvotes_count: newCount, has_upvoted: hasUpvoted } : c
      )
    );
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
    setSortBy('newest');
  };

  return (
    <div className="complaints-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Explore Public Complaints</h1>
          <p className="page-subtitle">
            Browse, search, and upvote infrastructure issues reported by your fellow citizens.
          </p>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="filter-toolbar">
          <form onSubmit={handleSearchSubmit} className="filter-row-top">
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by issue title, location, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="upvotes">Sort: Most Upvoted</option>
            </select>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px' }}>
              Search
            </button>
          </form>

          {/* Quick Category Filter Pills */}
          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Results Count */}
        <div style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Showing <strong>{complaints.length}</strong> {complaints.length === 1 ? 'complaint' : 'complaints'}
          {category !== 'All' && ` in "${category}"`}
          {status !== 'All' && ` with status "${status}"`}
        </div>

        {/* Complaints Grid */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading public issues...
          </p>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <AlertCircle size={32} />
            </div>
            <h3>No Complaints Found</h3>
            <p>
              We couldn't find any issues matching your search and filter criteria. 
              Try resetting your filters or report a new civic issue.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={resetFilters} className="btn btn-secondary">
                Reset Filters
              </button>
              <Link to="/report" className="btn btn-primary">
                <PlusCircle size={16} />
                Report an Issue
              </Link>
            </div>
          </div>
        ) : (
          <div className="complaints-grid">
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} onVoteChange={handleVoteChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsPage;
