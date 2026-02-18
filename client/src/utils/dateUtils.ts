export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
};

export const formatShortDate = (date: string | Date | undefined | null): string => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};
