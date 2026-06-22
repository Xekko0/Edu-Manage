import PageHeader from '../ui/PageHeader';
import Card, { CardBody } from '../ui/Card';
import DataTable from '../ui/DataTable';

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
        <Card className="mb-4 border-teal-100">
          <CardBody className="!py-4">
            <div className="flex flex-wrap items-end gap-3">{filters}</div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="!p-0 sm:!p-0">
          <DataTable
            columns={columns}
            data={data}
            keyField={keyField}
            emptyMessage={emptyMessage}
            loading={loading}
          />
        </CardBody>
      </Card>

      {children}
    </div>
  );
}
