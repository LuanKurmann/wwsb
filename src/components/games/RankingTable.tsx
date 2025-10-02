import { RankingData } from '../../lib/swissunihockey';

interface RankingTableProps {
  rankingData: RankingData;
}

export default function RankingTable({ rankingData }: RankingTableProps) {
  const getAlignment = (align?: 'l' | 'c' | 'r') => {
    switch (align) {
      case 'c':
        return 'text-center';
      case 'r':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-blue-600">
        <h3 className="text-lg font-semibold text-white">{rankingData.title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {rankingData.headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-3 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200 ${getAlignment(
                    header.align
                  )}`}
                >
                  <span className="hidden md:inline">{header.text}</span>
                  <span className="md:hidden">{header.short || header.text}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankingData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${
                  row.highlight ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'
                } transition`}
              >
                {row.cells.map((cell, cellIndex) => {
                  const header = rankingData.headers[cellIndex];
                  const align = getAlignment(header?.align);

                  let cellContent = null;

                  if (cell.image?.url) {
                    cellContent = (
                      <div className="flex justify-center items-center">
                        <img
                          src={cell.image.url}
                          alt={cell.image.alt || ''}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    );
                  } else if (cell.text && cell.text.length > 0) {
                    cellContent = (
                      <span className={cell.highlight ? 'font-bold text-blue-600' : ''}>
                        {cell.text.join(' ')}
                      </span>
                    );
                  }

                  if (cell.link?.type === 'map') {
                    cellContent = (
                      <a
                        href={`https://maps.google.com/?q=${cell.link.y},${cell.link.x}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {cellContent}
                      </a>
                    );
                  }

                  return (
                    <td
                      key={cellIndex}
                      className={`px-3 py-2 text-sm text-gray-900 whitespace-nowrap ${align}`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
