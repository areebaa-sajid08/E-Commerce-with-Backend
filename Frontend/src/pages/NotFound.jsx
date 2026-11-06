import { Empty } from '../components/States'
export default function NotFound() {
  return (
    <div className="px-5 pt-40">
      <Empty title="This page doesn’t exist" text="The link may be old, or the piece has been removed." action={{ to: '/shop', label: 'Back to the shop' }} />
    </div>
  )
}
