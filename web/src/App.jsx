import { useState, useMemo } from 'react'
import './App.scss'
import { BskyAgent } from '@atproto/api'
import toast, { Toaster } from 'react-hot-toast';

function App() {
  let skyAgent = false;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 从 url 的 start 里边获得 username
  const startUsername = new URLSearchParams(window.location.search).get('start') || '';

  const [startFollowingAccount, setStartFollowingAccount] = useState(startUsername);
  const [followings, setFollowings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followAuthor, setFollowAuthor] = useState(true);

  const [fliteKeyword, setFliteKeyword] = useState('');
  const flitedFollowings = useMemo(() => {
    return followings.filter( actor => `${actor.displayName||''} : ${actor.description||''}`.includes(fliteKeyword));
  },[followings, fliteKeyword])

  const default_avatar = 'https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreihagr2cmvl2jt4mgx3sppwe2it3fwolkrbtjrhcnwjk4jdijhsoze@jpeg';
  const author_did = 'did:plc:vlt4uq7tqbbinku5q7u4u43r';

  const toFollowCount = useMemo(() => {
    return followings.filter( actor => actor.toFollow).length;
  },[followings])

  const blukFollow = async () => {
    const agent = await getAgent();
    const toFollows = followings.filter( actor => actor.toFollow);
    for( let i=0 , len=toFollows.length; i < len; i++ )
    {
      const actor = toFollows[i];
      const { uri } = await agent.follow(actor.did);
      console.log(uri);
      toast.success(`Followed: ${actor.displayName||actor.did} ${i+1}/${len}`);
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    }

    // 
    if( followAuthor )
    {
      await agent.follow(author_did);
      toast.success(`Followed: BlueWave creator`);
    }

  }

  const getAgent = async() => {
    if( skyAgent ) return skyAgent;
    const agent = new BskyAgent({
      service: 'https://bsky.social'
    })

    let ret;
    try {
      ret = await agent.login({
        identifier: username,
        password
      });
      console.log(ret);
      skyAgent = agent;
      toast.success('Connected, wait a minute please...');
      return agent;
    } catch (error) {
      console.error(error); 
      toast.error('Login failed, use APP password instead of account password.');
      window.setTimeout(()=>{
        if( window.confirm('Open bluesky APP password page?') )
      { 
        window.open('https://bsky.app/settings/app-passwords','_blank');
      }}, 1000);
    }

  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // setIsLoading(true);

    const agent = await getAgent();
    const max = 5;
    let cursor = null;
    let i = 0;
    let followed = [];

    do
    {
      i++;
      const { data } = await agent.getFollows({ actor: startFollowingAccount, limit: 100, cursor });
      console.log(data, `${i}/${max}`);
      if( followed.length < 1 && data.subject ) followed.push(data.subject);

      if( data.follows ) {
        
        followed = [...followed, ...data.follows];
        if( data.cursor ) {
          cursor = data.cursor;
        } 
      }
      console.log( followed, cursor )
    }while(cursor && i < max);
    followed = followed.filter((actor, index, self) => self.findIndex((t) => t.did === actor.did) === index);
    
    setFollowings(followed);
  };

  function toggleToFollow(status, did)
  {
    if( did == 'all' )
    {
      const newFollowings = flitedFollowings.map( actor => {
        return {
          ...actor,
          toFollow: status
        }
      });

      console.log(newFollowings);

      const mergedFollowings = [...newFollowings,...followings].filter((actor, index, self) => self.findIndex((t) => t.did === actor.did) === index);

      console.log(mergedFollowings);

      setFollowings(mergedFollowings);
      
      return;
    }else
    {
      const index = followings.findIndex( actor => actor.did === did );
      const newFollowings = [...followings];
      newFollowings[index] = {
        ...newFollowings[index],
        toFollow: status
      }
      setFollowings(newFollowings); 
    }  
  }

  return (
    <>
    <div className="text-3xl mt-10 text-center">BlueWave 🦋
    <div className="text-sm text-gray-300">Follow multiple users at once</div>
    <div className="flex flex-row justify-center mt-5 h-[54px]"><a href="https://www.producthunt.com/posts/bluewave-4?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-bluewave&#0045;4" target="_blank" rel="noreferrer"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=438815&theme=light" /></a></div>
    </div>
    <form onSubmit={handleFormSubmit} className="flex m-auto bg-blue-50 flex-col p-10 max-w-[600px] mt-10 rounded shadow-xl">
      <div className="flex bg-white mb-5 p-5 rounded">
      Read someone&apos;s  follow list and then batch follow users either through keywords or manual selection.
      </div>
      <div className="flex flex-row justify-between mb-5 items-center">
        <div className="left mr-5">Username</div>
        <div className="right"><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder='user.bsky.social' required/></div>
      </div>
      <div className="flex flex-row justify-between mb-5 items-center">
        <div className="left mr-5">APP Password <a href="https://bsky.app/settings/app-passwords" target='_blank' className=" underline hover:none " rel="noreferrer">[?]</a></div>
        <div className="right"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder='abcd-efgh-hijl-mnop'  required/></div>
      </div>
      <div className="flex flex-row justify-between mb-5 items-center">
        <div className="left mr-5">Starting Username</div>
        <div className="right"><input type="text" value={startFollowingAccount} required onChange={(e) => setStartFollowingAccount(e.target.value)} placeholder='user.bsky.social' /></div>
      </div>
      <button className="bg-white p-2 mt-5 blue" type="submit" disabled={isLoading}>Find</button>
      <div className="mt-5 text-gray-400">
        <label >
        <input type="checkbox" checked={followAuthor} onChange={(e)=>setFollowAuthor(e.target.checked)} className="mr-1"/>
        Follow the BlueWave creator to get updates.
        </label>
      </div>
    </form>
    <div className="mt-5 max-w-[600px] border m-auto rounded shadow-lg p-5 empty:hidden">  

      

      { followings && followings.length > 0 ? <>
        <div className="keywords w-full flex flex-row justify-between items-center mb-5 sticky top-1 bg-white z-50">
          <div className="left flex-1 mr-2"><input type="text" className="w-full" placeholder='Fliter keyword, like pixiv' value={fliteKeyword} onChange={(e) => setFliteKeyword(e.target.value)} /></div>
          <div className="right">
            <button className="gray" onClick={()=>toggleToFollow(true, 'all')}>Select All</button>
            <button onClick={()=>toggleToFollow(false, 'all')} className="ml-1 gray">None</button>
            <button className="ml-1 blue" onClick={()=>blukFollow()} disabled={toFollowCount< 1}>Follow({toFollowCount})</button>
          </div>
        </div>
        { flitedFollowings && flitedFollowings.length > 0 && flitedFollowings.map( actor => {
        {/* {
          "did": "did:plc:pnpcpzed5rqhi4o34jjt2vev",
          "handle": "chelsea-delta.bsky.social",
          "displayName": "こばっち(Chelsea Δ)",
          "avatar": "https://cdn.bsky.app/img/avatar/plain/did:plc:pnpcpzed5rqhi4o34jjt2vev/bafkreigjsm3imsp4drb7jwlsnrcqofk3bhngf2dtobvfmyp3ntkiiwzkxa@jpeg",
          "viewer": {
              "muted": false,
              "blockedBy": false
          },
          "labels": [],
          "description": "作詞/作曲するクリエイター。VTuberへの楽曲提供なども。 \n\nVTuber提供楽曲 :『感情論αについて(ニコラ・アルディン) 』『青に染まる(Nanoha。)』『ダイアローグ・ブルー(倖月りりぃ)』『水平線ディレイ(歌与ポメ)』\n\n各種SNSリンク→ http://potofu.me/chelsea-delta",
          "indexedAt": "2024-01-20T09:11:33.795Z"
      } */}
        return (
          <div key={actor.did} className="flex flex-row justify-between mb-5 border-t-2 pt-5 border-dashed group">
            <div className="w-[50px] flex flex-col">
              <img className="w-[48px] h-[48px] rounded-full shadow" src={actor.avatar||default_avatar} alt={actor.displayName} onError={(e)=>{
                e.target.onerror = null;
                e.target.src = default_avatar;
              }} loading='lazy' />
              <div className="mt-2 flex flex-col ">
                <label className="">Fo
                  <input type="checkbox" className="ml-1" checked={actor.toFollow||false} onChange={(e)=>toggleToFollow(
                    e.target.checked, actor.did
                  )} />
                </label>
              </div>
            </div>
            <div className="ml-5 flex-1 text-wrap whitespace-break-spaces relative text-content">
              <div className="text-lg underline"><a href={`https://bsky.app/profile/${actor.handle}`} target="_blank" rel="noreferrer">{actor.displayName}</a></div>  
              <div className="text-sm text-gray-400">{actor.description}</div>
              <div className="absolute right-0 top-0 group-hover:flex hidden"><button className="blue" onClick={()=>{
                setStartFollowingAccount(actor.handle||actor.did);
                // 页面平滑滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
              }}>🦋 find</button></div>
            </div>
          </div>
        )
        })}
      </>  : null }
    </div>
    <Toaster position='bottom-center' />
    </>
  );
}

export default App
