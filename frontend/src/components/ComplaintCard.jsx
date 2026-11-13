import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ThumbsUp, ArrowRight, Tag } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getImageUrl } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ComplaintCard = ({ complaint, onVoteChange }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [upvotes, setUpvotes] = useState(complaint.upvotes_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(complaint.has_upvoted || false);
  const [voting, setVoting] = useState(false);

  const handleVote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (voting) return;
    setVoting(true);

    try {
      const res = await api.post(`/complaints/${complaint.id}/vote`);
      setUpvotes(res.data.upvotes_count);
      setHasUpvoted(res.data.has_upvoted);
      if (onVoteChange) {
        onVoteChange(complaint.id, res.data.upvotes_count, res.data.has_upvoted);
      }
    } catch (err) {
      console.error('Failed to toggle vote:', err.message);
    } finally {
      setVoting(false);
    }
  };

  const formattedDate = new Date(complaint.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="complaint-card">
      <div className="card-image-wrap">
        <img
          src={getImageUrl(complaint.image_url)}
          alt={complaint.title}
          className="card-image"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
          }}
        />
        <div className="card-badge-overlay">
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <div className="card-body">
        <div className="card-meta-top">
          <span className="card-id">#{complaint.id}</span>
          <span className="card-category">
            <Tag size={12} />
            {complaint.category}
          </span>
        </div>

        <h3 className="card-title" title={complaint.title}>
          <Link to={`/complaints/${complaint.id}`}>{complaint.title}</Link>
        </h3>

        <p className="card-desc">
          {complaint.description.length > 110
            ? `${complaint.description.substring(0, 110)}...`
            : complaint.description}
        </p>

        <div className="card-location">
          <MapPin size={14} className="card-icon" />
          <span>{complaint.address || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}</span>
        </div>

        <div className="card-footer">
          <div className="card-date">
            <Calendar size={13} />
            <span>{formattedDate}</span>
          </div>

          <div className="card-actions">
            <button
              onClick={handleVote}
              className={`vote-btn ${hasUpvoted ? 'voted' : ''}`}
              title={isAuthenticated ? 'Upvote this issue' : 'Log in to upvote'}
              disabled={voting}
            >
              <ThumbsUp size={14} />
              <span>{upvotes}</span>
            </button>

            <Link to={`/complaints/${complaint.id}`} className="view-details-btn">
              Details
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;
