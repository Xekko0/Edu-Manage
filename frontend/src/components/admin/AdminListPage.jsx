import PageHeader from '../ui/PageHeader';
import Card, { CardBody } from '../ui/Card';
import DataTable from '../ui/DataTable';
import Spinner from '../ui/Spinner';

/**
 * Template danh sách admin: header + filter + bảng trong Card.
 */
export default function AdminListPage({
  title,
  description,
  actions,
  filters,
  columns,
  data,
  loading,
  emptyMessage,
  keyField = 'id',
  children,
}) {
  return (
    <div>
      <PageHeader title={title} description={description}>
        {actions}
      </PageHeader>

      {filters && (
        <Card className="mb-4">
          <CardBody className="!py-4">{filters}</CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="!p-0 sm:!p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              keyField={keyField}
              emptyMessage={emptyMessage}
            />
          )}
        </CardBody>
      </Card>

      {children}
    </div>
  );
}
