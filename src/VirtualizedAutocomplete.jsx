import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react'
import TextField from '@mui/material/TextField';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList } from 'react-window';
import Typography from '@mui/material/Typography';
import { matchSorter } from 'match-sorter';
import { debounce } from '@mui/material';


const LISTBOX_PADDING = 8; // px

function renderRow(props) {
  const { data, index, style } = props;
  const dataSet = data[index];
  const inlineStyle = {
    ...style,
    top: style.top + LISTBOX_PADDING,
  };

  if (dataSet.hasOwnProperty('group')) {
    return (
      <ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
        {dataSet.group}
      </ListSubheader>
    );
  }

  return (
    <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
      {dataSet[1]}
    </Typography>
  );
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Adapter for react-window
const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData = [];
  children.forEach((item) => {
    itemData.push(item);
    itemData.push(...(item.children || []));
  });

  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
    noSsr: true,
  });

  const itemCount = itemData.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = (child) => {
    if (child.hasOwnProperty('group')) {
      return 48;
    }

    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 10) {
      return 10 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={(index) => getChildSize(itemData[index])}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: 'border-box',
    '& ul': {
      padding: 0,
      margin: 0,
    },
  },
});

export default function VirtualizedAutocomplete({label, loading, options, ...props}) {
  /*
  Kinda convoluted debounced search to fix performance issues
  */
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncing, setDebouncing] = useState(false);

  const acceptSearchQuery = useCallback((query) => {
    setSearchQuery(query);
    setDebouncing(false);
  }, []);

  const setSearchQueryDebounced = useMemo(() => {
    return debounce(acceptSearchQuery, 500);
  }, [acceptSearchQuery]);

  useEffect(() => {
    return () => {
      setSearchQueryDebounced.clear();
    };
  }, [setSearchQueryDebounced]);

  const handleSearchQueryChange = useCallback((event) => {
    const query = event.target.value;
    setSearchQueryDebounced(query);
    setDebouncing(true);
  }, [setSearchQueryDebounced]);

  const filteredOptions = useMemo(() => {
    if (!options || debouncing) { return []; }
    if (searchQuery === '') {
      return options;
    }
    return matchSorter(options, searchQuery);
  }, [options, searchQuery, debouncing]);

  // We don't need Autocomplete to do any filtering or checking since we do it ourselves
  const dummyFilter = useCallback((options) => options, []);

  // Do some memos to avoid rerenders
  const renderInputMemo = useCallback((params) => <TextField {...params} onChange={handleSearchQueryChange} label={label} />, [handleSearchQueryChange, label]);

  return (
    <Autocomplete
      id="virtualize-demo"
      sx={{ width: 300 }}
      filterOptions={dummyFilter}
      disableListWrap
      PopperComponent={StyledPopper}
      ListboxComponent={ListboxComponent}
      renderInput={renderInputMemo}
      renderOption={(props, option) => [props, option]}
      renderGroup={(params) => params}
      loading={debouncing || loading}
      options={filteredOptions}
      {...props}
    />
  );
}
