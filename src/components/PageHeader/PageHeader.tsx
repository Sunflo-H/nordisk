type PageHeaderProps = {
  title: string;
};

// 페이지 상단 제목 (/inventory, /event 공용)
const PageHeader: React.FC<PageHeaderProps> = ({ title }) => {
  return (
    <div className="max-w-[1200px] m-auto px-4 pt-8">
      <header className="text-2xl font-bold text-center">{title}</header>
    </div>
  );
};

export default PageHeader;
