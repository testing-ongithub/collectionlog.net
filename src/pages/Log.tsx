import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import DocumentMeta from 'react-document-meta';
import { useParams } from 'react-router-dom';

import { AccountType, expectedMaxUniqueItems } from '../app/constants';
import { useAppDispatch, useAppSelector, useCollectionLog } from '../app/hooks';
import {
  loadHiscoresRanks,
  loadRecentItems,
  loadUserSettings,
} from '../app/reducers/log/slice';
import {
  AccountIcon,
  Button,
  Item,
  PageTitle,
  Spinner,
  Tabs,
} from '../components/elements';
import RankIcon from '../components/elements/RankIcon';
import { PageContainer, PageHeader } from '../components/layout';
import { formatDate, updateUrl } from '../utils';

import AnalyticsService from '../services/analytics';
import { OpenPage } from '../services/collection-log';
import ErrorService from '../services/errors';

const DEFAULT_TAB = 'Bosses';
const DEFAULT_PAGE = 'Abyssal Sire';
const URL_PATH = 'log';

const Log = () => {
  const logState = useAppSelector((state) => state.log);
  const dispatch = useAppDispatch();
  const params = useParams();

  const paramsPage = params.pageName;

  const [openPage, setOpenPage] = useState<OpenPage>({
    tab: DEFAULT_TAB,
    page: DEFAULT_PAGE,
  });

  const [errorMessage, setErrorMessage] = useState<string>();

  const { ranks, userSettings } = logState;

  const { data: collectionLog, isLoading, error } = useCollectionLog(params.username?.trim() as string);

  useEffect(() => {
    if (!collectionLog || !paramsPage) {
      return;
    }

    const tab = collectionLog.getTabFromPage(paramsPage);
    if (!tab) {
      return;
    }

    setOpenPage({
      tab,
      page: paramsPage,
    });
    updateUrl(`/${URL_PATH}/${params.username}/${openPage.page}`);

    AnalyticsService.clTabChangeEvent(openPage);
  }, [collectionLog]);

  useEffect(() => {
    if (!error) {
      return setErrorMessage(undefined);
    }
    setErrorMessage(ErrorService.mapError(error, params.username as string));
  }, [error]);

  /**
   * Load collection log data from API.
   *
   * Called on search
   */
  useEffect(() => {
    const username = params.username?.trim();
    if (!username) {
      return;
    }

    dispatch(loadUserSettings(username));
    dispatch(loadRecentItems(username));
    dispatch(loadHiscoresRanks(username));
  }, [params.username]);

  const entryData = collectionLog?.getPage(openPage);
  const obtainedCount = entryData?.items.filter((item) => item.obtained).length;
  const itemCount = entryData?.items.length;
  const recentItems = logState.recentItems;

  let obtainedClass = 'text-yellow';
  if (obtainedCount == itemCount) {
    obtainedClass = 'text-green';
  } else if (!obtainedCount) {
    obtainedClass = 'text-red';
  }

  const explicitlyCountedUniques = collectionLog?.countObtainedUniques();

  const onTabClick = (tabName: string) => {
    const pages = Object.keys(collectionLog?.getPages(tabName) ?? []);
    setOpenPage({
      tab: tabName,
      page: pages[0],
    });
    updateUrl(`/${URL_PATH}/${params.username}/${pages[0]}`);

    AnalyticsService.clTabChangeEvent(openPage);
  };

  const onEntryClick = (entryName: string) => {
    setOpenPage({
      ...openPage,
      page: entryName,
    });
    showEntries();
    updateUrl(`/${URL_PATH}/${params.username}/${entryName}`);

    AnalyticsService.clPageChangeEvent(entryName);
  };

  const showEntries = () => {
    const entryList = document.getElementById('entry-list');
    const entryItems = document.getElementById('entry-items');

    const isHidden = entryList?.classList.contains('hidden');

    if (isHidden) {
      entryList?.classList.remove('hidden');
      entryList?.classList.add('block');

      entryItems?.classList.add('hidden');
      entryItems?.classList.remove('flex');
    } else {
      entryList?.classList.add('hidden');
      entryList?.classList.remove('block');

      entryItems?.classList.add('flex');
      entryItems?.classList.remove('hidden');
    }
  };

  const pageTitle = 'Collection Log';

  const meta = {
    title: pageTitle,
    property: {
      'og:title': pageTitle,
      'twitter:title': pageTitle,
    },
    auto: {
      ograph: true,
    },
  };

  if (collectionLog?.getUsername()) {
    meta.title = `${collectionLog.getUsername()} | ${pageTitle}`;
  }

  let displayRank = undefined;
  if (ranks) {
    displayRank = ranks[userSettings?.displayRank ?? 'ALL'];
  }

  return (
    <PageContainer>
      <DocumentMeta {...meta} />
      {isLoading ?
        <Spinner />
        : errorMessage ?
          <div className='flex justify-center items-center'>
            <h1 className='text-error'>{errorMessage}</h1>
          </div>
          :
          <>
            <PageHeader className='flex-col'>
              <div className='flex justify-center items-center'>
                <AccountIcon accountType={collectionLog?.getAccountType() as AccountType} height='20px' />
                <PageTitle title={`${collectionLog?.getUsername()}'s Collection log`} />
              </div>
              <div className='flex justify-center items-center'>
                <p className='mx-2 text-lg font-bold text-center text-orange'>Obtained: <span className='text-white'>{collectionLog?.getUniqueObtained()}/{collectionLog?.getUniqueItems()}</span></p>
                <RankIcon rankType={userSettings?.displayRank ??'ALL'} height='15px' />
                <div className='group'>
                  <p className='mx-1 text-lg font-bold text-center text-orange'>
                    Rank <span className='text-white'>#{displayRank}</span>
                  </p>
                  <div className='hidden group-hover:flex group-hover:flex-col w-[5%] absolute p-2 bg-primary z-50 border-2 border-black'>
                    {ranks && Object.keys(ranks).map((rankType, i) => {
                      const rankValue = ranks[rankType as RankType];
                      if (!rankValue) {
                        return;
                      }
                      return <div key={`${i}-${rankType}`} className='flex justify-between items-center'>
                        <RankIcon rankType={rankType as RankType} height='15px' />
                        <p className='text-white font-bold'>#{rankValue}</p>
                      </div>;
                    })}
                  </div>
                </div>
                <FontAwesomeIcon icon={faChevronDown} className='h-[10px] mb-1 text-orange icon-shadow'/>
              </div>
              {collectionLog && collectionLog?.getUniqueItems() < expectedMaxUniqueItems &&
                <p className='text-lg font-bold text-center text-yellow'>
                  New unique items have been added to Old School RuneScape! Please re-upload collection log data.
                </p>
              }
              {collectionLog && collectionLog?.getUniqueObtained() !== explicitlyCountedUniques &&
                <p className='text-lg font-bold text-center text-yellow'>
                  Total obtained does not match specific items collected. Please re-upload collection log data.
                </p>
              }
            </PageHeader>
            <div className='md:mx-3 mb-3 md:mt-1 h-full border-2 border-t-0 border-light md:rounded-tr-[10px] md:rounded-tl-[10px] md:overflow-hidden'>
              <Tabs activeTab={openPage.tab} onClick={onTabClick}>
                {collectionLog && collectionLog.getTabs().map((tabName) => {
                  const pages = Object.keys(collectionLog.getPages(tabName) ?? []);
                  return (
                    <div key={tabName} data-tab={tabName}>
                      <div className='flex w-full h-[94%] md:overflow-hidden'>
                        <div id='entry-list' className='pb-5 w-full md:w-1/4 h-full border-black border-r shadow-log overflow-y-scroll hidden md:block'>
                          {pages.map((pageName, i) => {
                            const isComplete = collectionLog.isPageCompleted(pageName);
                            const textColor = isComplete ? 'text-green' : 'text-orange';

                            let bg = i % 2 == 0 ? 'bg-primary' : 'bg-light';
                            bg = pageName == openPage.page ? 'bg-highlight' : bg;

                            return (
                              <p
                                className={`${bg} hover:bg-highlight ${textColor} text-lg cursor-pointer`}
                                onClick={() => onEntryClick(pageName)}
                                key={pageName}>
                                {pageName}
                              </p>
                            );
                          })}
                        </div>
                        <div id='entry-items' className='flex md:flex flex-col w-full md:w-3/4'>
                          <div className='mx-2 border-b border-b-lighter shadow-log'>
                            <Button title='Show Pages' className='w-full block md:hidden' onClick={showEntries} />
                            <h3 className='text-xl font-bold text-orange'>{openPage.page}</h3>
                            <p className='text-orange'>Obtained: <span className={obtainedClass}>{obtainedCount}/{itemCount}</span></p>
                            {entryData?.killCount?.map((kc, i) => {
                              return (
                                <p key={`${i}-${kc.name}`} className='text-orange'>
                                  {kc.name}: <span className='text-white'>{kc.amount}</span>
                                </p>
                              );
                            })}
                          </div>
                          <div className='flex flex-wrap grow content-start px-2 pt-3 mb-3 overflow-y-auto shadow-log'>
                            {entryData?.items.map((item, i) => {
                              return (
                                <Item key={`${i}-${item.id}`} item={item} showQuantity={userSettings?.showQuantity} showTooltip={true} />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Tabs>
            </div>
            <div>
              <PageHeader className='border-black border-t-4'>
                <PageTitle title='Recent items' />
              </PageHeader>
              <div className='flex sm:flex-wrap flex-col sm:flex-row justify-center sm:justify-around grow p-2 mt-[10px]'>
                {recentItems?.map((item, i) => {
                  return (
                    <div key={`${i}-${item.id}`} className='flex flex-wrap justify-center grow'>
                      <Item item={item} showQuantity={false} isDetail={true}/>
                      <div className='flex flex-col'>
                        <p>{item.name}</p>
                        <p>{formatDate(item.obtainedAt as string)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
      }
    </PageContainer>
  );
};

export default Log;