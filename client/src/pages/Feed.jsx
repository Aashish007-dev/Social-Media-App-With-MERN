import React, { useEffect, useState } from 'react'
import { dummyPostsData } from '../assets/assets';
import Loading from '../components/Loading';
import StoriesBar from '../components/StoriesBar';
import PostCard from '../components/PostCard';

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);


  const fetchFeed = async () => {
 
    setFeeds(dummyPostsData)
    setLoading(false)
  
  }

  useEffect(() => {
    fetchFeed()
  }, []);

  return !loading ? (
    <div className='h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8'>
      {/* Stories and Post list */}

      <div>
          <StoriesBar />
          <div className='pt-4 space-y-6'>
            {
              feeds.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            }
          </div>
      </div>

      {/* Right side bar */}
      <div>
        <div>
          <h1>Sponsored</h1>
        </div>
        <h1>Recent messages</h1>
      </div>

    </div>
  ) : (
    <Loading />
  )
}

export default Feed