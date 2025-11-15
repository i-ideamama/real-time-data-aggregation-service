import './Pagination.css';

interface PaginationProps {
  offset: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onPageChange?: (offset: number) => void;
}

const Pagination = ({
  offset,
  limit,
  totalCount,
  hasMore,
  onNextPage,
  onPrevPage,
}: PaginationProps) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);
  const startIdx = offset + 1;
  const endIdx = Math.min(offset + limit, totalCount);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing <span className="info-number">{startIdx}</span> to{' '}
        <span className="info-number">{endIdx}</span> of{' '}
        <span className="info-number">{totalCount}</span> tokens
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={onPrevPage}
          disabled={offset === 0}
          title="Previous page"
        >
          ← Previous
        </button>

        <div className="pagination-status">
          Page <span className="page-number">{currentPage}</span> of{' '}
          <span className="page-number">{totalPages}</span>
        </div>

        <button
          className="pagination-btn"
          onClick={onNextPage}
          disabled={!hasMore}
          title="Next page"
        >
          Next →
        </button>
      </div>

      <div className="pagination-info">
        <span className="page-size">Page size: {limit}</span>
      </div>
    </div>
  );
};

export default Pagination;
