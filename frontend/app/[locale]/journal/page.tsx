import { redirect } from 'next/navigation'

export default function JournalPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/about`)
}
